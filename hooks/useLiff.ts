import liff from '@line/liff';

export const useLiff = () => {
  const logout = async () => {
    console.log('Logging out');
    if (liff.isLoggedIn()) {
      liff.logout();
      window.location.reload();
    }
  }

  return { logout };
}