import { client } from './init/line';
import { TemplateMessage } from '@line/bot-sdk';

export const sendPeriodSettingMessage = async (replyToken: string) => {
  const message: TemplateMessage = {
    type: 'template',
    altText: '期間設定',
    template: {
      type: 'buttons',
      text: '期間を設定するオプションを選択してください',
      actions: [
        {
          type: 'datetimepicker',
          label: '開始日',
          data: 'action=setStartDate',
          mode: 'date'
        },
        {
          type: 'datetimepicker',
          label: '終了日',
          data: 'action=setEndDate',
          mode: 'date'
        }
      ]
    }
  };
  await client.replyMessage(replyToken, message);
};
