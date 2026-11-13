// Modified for Screen 2 Screen: tabbed activity panel, reused as a mobile sheet.
import { useStore } from 'zustand'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontalIcon, UsersThreeIcon, XIcon } from '@phosphor-icons/react'
import { useApp } from '@/state/provider'
import { remember } from '@/state/storage'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Settings } from '@/features/settings/Settings'
import { ParticipantList } from '@/features/members/ParticipantList'
import { useSlot } from '@/plugins'
import type { PluginTab } from '@/plugins/types'
import { EachHook } from '@/components/EachHook'

const settingsTab: PluginTab = {
  id: 'settings',
  icon: SlidersHorizontalIcon,
  label: 'side.settings',
  component: Settings,
}
const peopleTab: PluginTab = { id: 'people', icon: UsersThreeIcon, label: 'side.people', component: ParticipantList }
const always = () => true

export function Side({ inSheet = false }: { inSheet?: boolean }) {
  const tabs = useSlot('side.tab')
  return (
    <EachHook items={tabs} use={(tab) => tab.useVisible ?? always}>
      {(visible) => <Panel tabs={[...tabs.filter((_, i) => visible[i]), peopleTab, settingsTab]} inSheet={inSheet} />}
    </EachHook>
  )
}

function Panel({ tabs, inSheet }: { tabs: PluginTab[]; inSheet: boolean }) {
  const { t } = useTranslation()
  const app = useApp()
  const wanted = useStore(app, (s) => s.tab)
  const tab = tabs.some((x) => x.id === wanted) ? wanted : tabs[0].id
  const Page = tabs.find((x) => x.id === tab)!.component

  return (
    <aside
      className={
        inSheet
          ? 'flex h-full min-h-0 w-full flex-col bg-card'
          : 'flex h-full min-h-0 w-side shrink-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm'
      }
      data-testid="side"
      aria-label="Room activity"
    >
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b px-4">
        <div>
          <h2 className="font-display text-sm font-bold">Room activity</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Everything happening in this room</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close activity panel"
          onClick={() => {
            app.setState({ side: false })
            remember('side', false)
          }}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      <Tabs
        value={tab}
        onValueChange={(id) => {
          app.setState({ tab: id })
          remember('tab', id)
        }}
        className="min-h-0 flex-1 gap-0"
      >
        <TabsList
          data-testid="tabs"
          className="mx-3 mt-3 grid h-12 w-[calc(100%-1.5rem)] shrink-0 rounded-lg p-1"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ id, icon: Icon, label }) => (
            <TabsTrigger key={id} value={id} className="flex-col gap-0.5 rounded-md px-1 text-[10px] [&_svg]:size-4">
              <Icon />
              <span>{t(label)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-2 flex min-h-0 flex-1 overflow-hidden">
          <Page />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
