import FileDown from 'lucide-react/dist/esm/icons/file-down'
import Info from 'lucide-react/dist/esm/icons/info'
import Layers3 from 'lucide-react/dist/esm/icons/layers-3'
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2'
import Repeat2 from 'lucide-react/dist/esm/icons/repeat-2'
import Settings from 'lucide-react/dist/esm/icons/settings'

export const PRIMARY_NAV = [
  { to: '/resize', label: 'Resize', icon: Maximize2 },
  { to: '/compress', label: 'Compress', icon: FileDown },
  { to: '/convert', label: 'Convert', icon: Repeat2 },
  { to: '/batch', label: 'Batch', icon: Layers3 },
] as const

export const SECONDARY_NAV = [
  { to: '/about', label: 'About', icon: Info },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const
