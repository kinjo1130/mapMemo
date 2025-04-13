import React, { useEffect, useState } from "react";
import { useLiff } from "@/hooks/useLiff";
import Header from "@/components/Header";
import { useProfile } from "@/hooks/useProfile";
import liff from "@line/liff";
import SEO from "@/components/SEO";

export default function IconHomeInstall() {
  const { profile, loading: profileLoading } = useProfile();
  const { logout } = useLiff();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    if (liff) {
      const os = liff.getOS();
      setIsIOS(os === "ios");
      setIsAndroid(os === "android");
      setIsWeb(os === "web");
    }
  }, []);

  if (profileLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <SEO
        title="ホーム画面に追加"
        description="MapMemoをホーム画面に追加する方法"
      />
      <Header profile={profile} logout={logout} />
      <main className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h1 className="text-xl font-bold text-center mb-4">
            ホーム画面に追加
          </h1>

          {isIOS && (
            <div className="space-y-4">
              <p className="text-center">
                iOSデバイスでMapMemoをホーム画面に追加するには：
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  画面下部の<span className="font-semibold">共有ボタン</span>
                  （□に上向き矢印）をタップ
                </li>
                <li>
                  <span className="font-semibold">「ホーム画面に追加」</span>
                  をタップ
                </li>
                <li>
                  右上の<span className="font-semibold">「追加」</span>をタップ
                </li>
              </ol>
            </div>
          )}

          {isAndroid && (
            <div className="space-y-4">
              <p className="text-center">
                Androidデバイスでホーム画面に追加するには：
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  ブラウザの
                  <span className="font-semibold">メニューボタン</span>
                  （⋮）をタップ
                </li>
                <li>
                  <span className="font-semibold">「ホーム画面に追加」</span>
                  をタップ
                </li>
                <li>
                  <span className="font-semibold">「追加」</span>
                  をタップして確定
                </li>
              </ol>
            </div>
          )}

          {isWeb && (
            <div className="space-y-4">
              <p className="text-center">
                スマートフォンからこのページにアクセスして、ホーム画面に追加してください。
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
