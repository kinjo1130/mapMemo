- ngrokでトンネルを自動でやってほしい
- liff-cliでやってみるか



NGROK_AUTHTOKEN=1iN4PXXqUXAlehepDfH9CGDfqIe_2c2XKLeVD747E1k4Beyqy liff-cli serve \
  --liff-id 1234567890-AbcdEfgh \
  --url http://localhost:3000/ \
  --proxy-type ngrok
