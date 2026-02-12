import { fallbackBlueprintData } from '@/lib/system-blueprint-data'
import { BlueprintPayload } from '@/lib/types/system-blueprint'

async function getBlueprintData(): Promise<BlueprintPayload> {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/system-blueprint', {
      cache: 'no-store',
    })

    if (!response.ok) {
      return fallbackBlueprintData
    }

    return (await response.json()) as BlueprintPayload
  } catch {
    return fallbackBlueprintData
  }
}

export default async function SystemBlueprintPage() {
  const data = await getBlueprintData()

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm md:p-12">
        <header className="border-b border-[#dbe2e8] pb-8">
          <p className="text-sm font-semibold text-[#00a896]">מסמך: קטלוג מודולים</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#24323d]">{data.meta.product_name}</h1>
              <p className="mt-2 text-xl text-[#2f4858]">{data.meta.positioning}</p>
            </div>
            <div className="text-sm text-[#4f6472]">
              <p>
                <span className="font-bold">גרסה:</span> {data.meta.version}
              </p>
              <p>
                <span className="font-bold">תאריך:</span> {data.meta.last_updated}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-3xl font-bold text-[#00a896]">קטלוג המודולים (Modules)</h2>
          <div className="mt-6 space-y-6">
            {data.modules.map((module) => (
              <article key={module.id} className="rounded-2xl border border-[#e2e8ee] p-6">
                <div className="flex items-center justify-between border-b border-[#edf2f7] pb-4">
                  <p className="text-sm font-semibold text-[#9da9b3]">{module.category}</p>
                  <h3 className="text-4xl font-bold text-[#253441]">
                    {module.order}. {module.name}
                  </h3>
                </div>
                <p className="mt-5 text-2xl font-semibold text-[#00a896]">למי זה מיועד? {module.for_who}</p>
                <p className="mt-3 text-xl leading-relaxed text-[#334e5d]">{module.description}</p>
                <ul className="mt-4 space-y-3 text-xl text-[#2f4858]">
                  {module.capabilities.map((capability) => (
                    <li key={capability} className="flex gap-3">
                      <span className="text-[#00a896]">✔</span>
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl bg-[#f8fbfc] p-6">
          <h2 className="text-3xl font-bold text-[#00a896]">🔔 Smart Notifications (התראות חכמות)</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {data.smart_notifications.engines.map((engine) => (
              <div key={engine.name} className="rounded-xl border border-[#e2e8ee] bg-white p-4">
                <h3 className="text-xl font-bold text-[#24323d]">{engine.name}</h3>
                <ul className="mt-3 space-y-2 text-lg text-[#334e5d]">
                  {engine.examples.map((example) => (
                    <li key={example} className="flex gap-2">
                      <span className="text-[#d2691e]">✓</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e2e8ee] p-6">
            <h2 className="text-2xl font-bold text-[#24323d]">יישויות נתונים מרכזיות</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.core_entities.map((entity) => (
                <span key={entity} className="rounded-full bg-[#e6f7f5] px-3 py-1 text-sm text-[#0f6f67]">
                  {entity}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e2e8ee] p-6">
            <h2 className="text-2xl font-bold text-[#24323d]">אינטגרציות מומלצות</h2>
            <ul className="mt-4 space-y-2 text-lg text-[#334e5d]">
              {data.integration_targets.map((target) => (
                <li key={target}>• {target}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
