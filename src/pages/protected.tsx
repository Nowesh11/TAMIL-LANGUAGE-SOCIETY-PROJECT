import type { GetServerSideProps } from 'next';
import dbConnect from '../lib/mongodb';
import User from '../models/User';
import { verifyRefreshToken } from '../lib/auth';

function parseCookies(cookieHeader?: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(part => {
    const [name, ...rest] = part.trim().split('=');
    cookies[name] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = parseCookies(ctx.req.headers.cookie);
  const refresh = cookies['refresh_token'];
  const decoded = verifyRefreshToken(refresh);
  if (!decoded) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  await dbConnect();
  const user = await User.findById(decoded.sub);
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  if (user.role === 'admin') {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  return { props: { user: { id: String(user._id), email: user.email, role: user.role } } };
};

export default function ProtectedPage(props: { user: { id: string; email: string; role: string } }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Protected Page</h1>
      <p>Welcome {props.user.email}. Your role is {props.user.role}.</p>
      <p>Admins are redirected to /admin.</p>
    </div>
  );
}