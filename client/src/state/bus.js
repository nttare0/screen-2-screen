import { Emitter } from '@m1k1o/neko'
import { name } from './app'
import { t } from '@/i18n'
export const createBus = () => new Emitter()
// an event line attributed to a session ("bob took the controls")
export const event = ({ bus, client }, id, content) =>
  bus.emit('log', id, id === client.state.session_id ? t('you') : name(client, id), content)
// an event line with a literal author ("You kicked bob")
export const line = ({ bus }, name, content) => bus.emit('log', '', name, content)
