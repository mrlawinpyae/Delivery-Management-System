import { RiderFormDialog, type RiderFormDialogProps } from "./RiderFormDialog"

export function CreateRiderDialog(props: RiderFormDialogProps) {
  return <RiderFormDialog {...props} initialIsEdit={false} />
}
