import { RiderFormDialog, type RiderFormDialogProps } from "./RiderFormDialog"

export function EditRiderDialog(props: RiderFormDialogProps) {
  return <RiderFormDialog {...props} initialIsEdit={true} />
}
