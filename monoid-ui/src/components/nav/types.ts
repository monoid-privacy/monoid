export interface NavLink {
  title: React.ReactNode
  onClick: () => void
  current: boolean
  icon?: (props?: any) => JSX.Element
}
