import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function PwaLaunch() {
  const router = useRouter();

  useEffect(() => {
    // LINE botのURLに遷移（環境変数から取得）
    const lineBotUrl = process.env.NEXT_PUBLIC_LINE_BOT_ADD_FRIEND_URL || "https://line.me/R/ti/p/@991chidh";
    
    // 外部URLに遷移
    window.location.href = lineBotUrl;
  }, []);

  return (
    <>
      <Head>
        <title>MapMemo - リダイレクト中</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-xl font-bold mb-2">LINE botに接続中...</h1>
          <p className="text-gray-600">
            自動的にリダイレクトされない場合は、
            <a 
              href={process.env.NEXT_PUBLIC_LINE_BOT_ADD_FRIEND_URL || "https://line.me/R/ti/p/@991chidh"} 
              className="text-blue-600 underline"
            >
              こちら
            </a>
            をタップしてください。
          </p>
        </div>
      </div>
    </>
  );
}
