import { MessageCircle } from "lucide-react"

export function ChatWidget() {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-pass px-4 py-2.5 shadow-lg shadow-black/30 transition-transform hover:scale-105"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-xs font-bold text-pass">
        LG
      </div>
      <span className="text-sm font-medium text-bg">How can I help you?</span>
      <MessageCircle className="h-4 w-4 text-bg lg:hidden" />
    </button>
  )
}
