// Placeholder in-feed ad slot. Monetag's script (loaded in index.html) injects
// ads globally / via its own triggers — this box just reserves layout space
// so the page doesn't jump once ads start showing. Swap the label text or
// remove entirely once your Monetag zone is wired up and confirmed working.
export default function AdSlot({ label = "Advertisement" }) {
  return <div className="ad-slot">{label}</div>;
}
