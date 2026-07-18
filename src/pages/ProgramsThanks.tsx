import { useEffect, useState } from 'react'
import SuccessStep from '../components/quiz/SuccessStep'

export default function ProgramsThanks() {
  const [email, setEmail] = useState('you')
  useEffect(() => {
    const stored = sessionStorage.getItem('program_portal_email')
    if (stored) setEmail(stored)
  }, [])
  return <SuccessStep variant="paid" email={email} />
}
