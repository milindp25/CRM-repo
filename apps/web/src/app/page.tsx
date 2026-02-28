import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function Home() {
  const cookieStore = cookies();
  const hasSession = cookieStore.has('has_session') || cookieStore.has('access_token');

  if (hasSession) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
