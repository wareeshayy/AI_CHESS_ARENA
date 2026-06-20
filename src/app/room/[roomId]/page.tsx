import MultiplayerRoomView from "@/components/MultiplayerRoomView"

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  return <MultiplayerRoomView roomId={roomId} />
}
