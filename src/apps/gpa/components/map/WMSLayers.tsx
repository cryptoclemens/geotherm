// @ts-nocheck
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useLayerStore } from '../../store/useLayerStore'
import { useGpaStore } from '../../store/useGpaStore'
import { WMS_LAYERS } from '../../data/layers'

// Proxy chain — same as v5.43
const WMS_PROXIES = [
  url => url,                                                                      // 0: direct
  url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,                  // 1: corsproxy.io
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,          // 2: allorigins
  url => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,    // 3: codetabs
]

function makeProxiedWMS(baseUrl, options) {
  const wms = L.tileLayer.wms(baseUrl, options)
  const _orig = wms.getTileUrl.bind(wms)

  wms._proxyIdx   = 0
  wms._proxyOk    = false
  wms._switchTimer = null

  wms.getTileUrl = function (coords) {
    const raw = _orig(coords)
    return WMS_PROXIES[wms._proxyIdx](raw)
  }

  wms.on('tileerror', function () {
    if (wms._proxyOk) return
    if (wms._switchTimer) return
    if (wms._proxyIdx >= WMS_PROXIES.length - 1) return
    wms._switchTimer = setTimeout(() => {
      wms._switchTimer = null
      if (!wms._proxyOk && wms._proxyIdx < WMS_PROXIES.length - 1) {
        wms._proxyIdx++
        wms.redraw()
      }
    }, 600)
  })

  wms.on('tileload', function () {
    wms._proxyOk = true
    clearTimeout(wms._switchTimer)
    wms._switchTimer = null
  })

  return wms
}

// Individual WMS layer with proxy support
function WMSLayer({ id, wmsConfig }) {
  const map             = useMap()
  const layerRef        = useRef(null)
  const { setWmsBadge } = useGpaStore()
  const enabled         = useLayerStore(s => s.layers[id])

  useEffect(() => {
    if (!enabled) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
      return
    }

    if (!layerRef.current) {
      setWmsBadge(id, 'probing')

      const layer = makeProxiedWMS(wmsConfig.url, {
        layers:      wmsConfig.params.layers,
        format:      wmsConfig.params.format    || 'image/png',
        transparent: wmsConfig.params.transparent !== false,
        version:     wmsConfig.params.version   || '1.3.0',
        attribution: wmsConfig.attribution       || `© WMS · ${id}`,
        opacity:     wmsConfig.opacity           ?? 0.6,
        crossOrigin: false,
        ...(wmsConfig.minZoom ? { minZoom: wmsConfig.minZoom } : {}),
      })

      layer.on('tileload', () => setWmsBadge(id, 'live'))
      layer.on('tileerror', () => {
        if (layer._proxyIdx >= WMS_PROXIES.length - 1 && !layer._proxyOk) {
          setWmsBadge(id, 'error')
        }
      })

      layer.addTo(map)
      layerRef.current = layer
    }
  }, [enabled]) // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, []) // eslint-disable-line

  return null
}

export default function WMSLayers() {
  return (
    <>
      {Object.entries(WMS_LAYERS).map(([key, wms]) => (
        <WMSLayer key={key} id={key} wmsConfig={wms} />
      ))}
    </>
  )
}
