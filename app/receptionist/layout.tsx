import { requireReceptionistRole } from '@/lib/auth-utils'
import ReceptionistShell from '@/components/receptionist/shell'

export default async function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  await requireReceptionistRole()
  return <ReceptionistShell>{children}</ReceptionistShell>
}
