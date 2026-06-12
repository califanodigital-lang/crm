import ClientiTerziTab from '../components/ClientiTerziTab'

export default function ClientiPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
        <p className="text-sm text-gray-500 mt-1">
          Database anagrafico dei clienti esterni usati nei contratti e nei flussi amministrativi.
        </p>
      </div>
      <div className="card">
        <ClientiTerziTab />
      </div>
    </div>
  )
}
