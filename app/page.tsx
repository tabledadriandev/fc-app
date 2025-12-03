import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to frame endpoint
  redirect('/api/frame')
}

