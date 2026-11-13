import { useState } from 'react'
import { LinkIcon, CopyIcon, CheckIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/state/dialogs'
export function InviteButton() {
  const [copied, setCopied] = useState(false)
  const url = new URL(location.href)
  for (const key of ['token', 'pwd', 'usr', 'password', 'displayname']) url.searchParams.delete(key)
  url.hash = ''
  const link = url.toString()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast('Invite link copied', undefined, 'success')
    } catch {
      toast('Select the link and copy it manually', undefined, 'info')
    }
  }
  return (
    <Dialog onOpenChange={(open) => !open && setCopied(false)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" aria-label="Invite">
          <LinkIcon className="size-4" />
          <span className="hidden sm:inline">Invite</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bring people into the room</DialogTitle>
          <DialogDescription>
            Share this address. Guests still need the room password unless an administrator has unlocked the room.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="invite-link">Room link</Label>
          <div className="flex gap-2">
            <Input id="invite-link" readOnly value={link} onFocus={(e) => e.target.select()} />
            <Button size="icon" aria-label="Copy invite link" onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Credentials and session tokens are never included in this link.
          </p>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
