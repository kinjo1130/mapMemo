// controllers/lineWebhookController.ts
import { Context } from 'hono';
import { lineUserService } from '../services/lineUserService';
import { lineGroupService } from '../services/lineGroupService';
import { lineMessageService } from '../services/lineMessageService';
import { lineLocationService } from '../services/lineLocationService';
import {  Event,WebhookRequestBody } from '@line/bot-sdk';

class LineWebhookController {
  /**
   * LINEのWebhookイベントを処理するメインハンドラー
   */
  async handleWebhook(c: Context) {
    try {
      const body = await c.req.json() as WebhookRequestBody;
      const events = body.events;
      
      console.log(`Received ${events.length} events`);
      
      for (const event of events) {
        await this.routeEvent(event);
      }
      
      return c.text('OK', 200);
    } catch (error) {
      console.error('Error handling webhook:', error);
      return c.text('Internal Server Error', 500);
    }
  }
  
  /**
   * イベントタイプに基づいて適切なハンドラーにルーティング
   */
  private async routeEvent(event: Event) {
    switch (event.type) {
      case 'follow':
        await this.handleFollowEvent(event);
        break;
      case 'message':
        if (event.message.type === 'text') {
          await this.handleTextMessageEvent(event);
        }
        break;
      case 'postback':
        await this.handlePostbackEvent(event);
        break;
      case 'memberJoined':
        await this.handleMemberJoinedEvent(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
  
  /**
   * フォローイベントの処理
   */
  private async handleFollowEvent(event: Event & { type: 'follow' }) {
    const { userId } = event.source;
    console.log(`New follower: ${userId}`);
    
    try {
      await lineUserService.registerNewUser(userId);
    } catch (error) {
      console.error('Error registering new user:', error);
    }
  }
  
  /**
   * テキストメッセージイベントの処理
   */
  private async handleTextMessageEvent(event: Event & { type: 'message', message: { type: 'text', text: string } }) {
    const { userId, groupId } = event.source;
    const replyToken = event.replyToken;
    const messageText = event.message.text;
    const timestamp = new Date(event.timestamp);
    
    console.log(`ReplyToken: ${replyToken}`);
    console.log(`Message: ${messageText}`);
    
    // グループメッセージの処理
    if (groupId) {
      try {
        await lineGroupService.processGroupMessage(groupId, userId);
      } catch (error) {
        console.error('Error processing group message:', error);
      }
    }
    
    // ユーザー存在確認
    const userExists = await lineUserService.checkUserExists(userId);
    if (!userExists) {
      console.log(`User ${userId} is not registered`);
      return;
    }
    
    // 保存期間変更リクエスト
    if (messageText === '保存期間変更') {
      await lineMessageService.sendPeriodSettingMessage(replyToken);
      return;
    }
    
    // 保存期間チェック
    const withinPeriod = await lineUserService.isWithinUserPeriod(userId, timestamp);
    if (!withinPeriod) {
      await lineMessageService.sendReplyMessage(replyToken, 'この期間にはメッセージを保存できません。');
      return;
    }
    
    // Google Mapsリンクの処理
    if (lineLocationService.isGoogleMapsUrl(messageText)) {
      try {
        const result = await lineLocationService.saveGoogleMapsLink({
          mapUrl: messageText,
          userId,
          groupId: groupId || ''
        });
        
        if (result.error) {
          await lineMessageService.sendReplyMessage(replyToken, `エラーが発生しました: ${result.error}`);
        } else {
          await lineMessageService.sendReplyMessage(replyToken, 'Google Mapsのリンクを保存しました。');
        }
      } catch (error) {
        console.error('Error saving Google Maps link:', error);
        await lineMessageService.sendReplyMessage(replyToken, 'リンクの保存中にエラーが発生しました。');
      }
    } else {
      console.log(`Received non-Google Maps URL: ${messageText}`);
    }
  }
  
  /**
   * ポストバックイベントの処理
   */
  private async handlePostbackEvent(event: Event & { type: 'postback' }) {
    try {
      await lineMessageService.handlePostbackEvent(event);
    } catch (error) {
      await lineMessageService.sendReplyMessage(event.replyToken, 'ポストバックイベントの処理中にエラーが発生しました。');
    }
  }
  
  /**
   * メンバー参加イベントの処理
   */
  private async handleMemberJoinedEvent(event: Event & { type: 'memberJoined', joined: { members: Array<{ type: string, userId: string }> } }) {
    const { groupId } = event.source;
    const userIds = event.joined.members;
    
    try {
      for (const { userId } of userIds) {
        await lineGroupService.handleNewMember(groupId, userId);
      }
    } catch (error) {
      console.error('Error handling member joined event:', error);
    }
  }
}

export const lineWebhookController = new LineWebhookController();