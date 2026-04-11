import { Card, CardHeader, CardTitle, CardDescription } from '@/core/ui/card'

export default function VerifyEmailPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>E-Mail bestätigen</CardTitle>
        <CardDescription>
          Wir haben dir einen Bestätigungslink geschickt. Bitte überprüfe dein Postfach.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
