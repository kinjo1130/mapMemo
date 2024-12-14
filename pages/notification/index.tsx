import Header from "@/components/Header";
import Notification  from "@/features/Notification/components/Notification.page";
import { useLiff } from "@/hooks/useLiff";
import { useProfile } from "@/hooks/useProfile";

const Page = () => {
  const { profile } = useProfile();
  const { logout } = useLiff();
  return (
    <div className="flex flex-col h-screen bg-gray-100 gap-4" >
      <Header profile={profile} logout={logout} />
    <Notification />
    </div>
  );
}
export default Page;