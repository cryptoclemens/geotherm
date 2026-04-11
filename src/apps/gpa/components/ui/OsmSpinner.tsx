// @ts-nocheck
import { useGpaStore } from '../../store/useGpaStore'

export default function OsmSpinner() {
  const { osmSpinning, osmSpinnerSub } = useGpaStore()

  if (!osmSpinning) return null

  return (
    <div id="osm-spinner">
      <div id="osm-spinner-ring" />
      <div id="osm-spinner-label">
        <span>OSM</span>
        {osmSpinnerSub && <span id="osm-spinner-sub">{osmSpinnerSub}</span>}
      </div>
    </div>
  )
}
