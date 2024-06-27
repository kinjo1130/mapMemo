import { client } from './init/line';
import { TemplateMessage } from '@line/bot-sdk';

export const sendPeriodSettingMessage = async (replyToken: string) => {
  const message: TemplateMessage = {
    type: 'template',
    altText: 'Set period',
    template: {
      type: 'buttons',
      text: 'Please select an option to set the period',
      actions: [
        {
          type: 'datetimepicker',
          label: 'Start Date',
          data: 'action=setStartDate',
          mode: 'date'
        },
        {
          type: 'datetimepicker',
          label: 'End Date',
          data: 'action=setEndDate',
          mode: 'date'
        }
      ]
    }
  };
  await client.replyMessage(replyToken, message);
};
