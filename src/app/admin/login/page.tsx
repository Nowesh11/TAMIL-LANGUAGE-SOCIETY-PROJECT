import { redirect } from 'next/navigation'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectTo } = await searchParams
  const target = redirectTo || '/admin/dashboard'
  redirect(`/login?redirect=${encodeURIComponent(target)}`)
}
