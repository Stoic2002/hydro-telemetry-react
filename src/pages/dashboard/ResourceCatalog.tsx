import { useSearchParams } from 'react-router-dom';
import { CatalogTabs } from './resource-catalog/CatalogTable';
import {
  PlantsCatalog,
  RiverBasinsCatalog,
  TagsCatalog,
} from './resource-catalog/CatalogViews';
import {
  parseCatalogView,
  type CatalogView,
} from './resource-catalog/model';

export default function ResourceCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = parseCatalogView(searchParams.get('view'));
  const requestedPlantId = searchParams.get('plta') ?? '';

  const setView = (view: CatalogView) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('view', view);
      if (view !== 'tags') nextParams.delete('plta');
      return nextParams;
    });
  };

  const openTags = (pltaId: string) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('view', 'tags');
      nextParams.set('plta', pltaId);
      return nextParams;
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">Katalog Monitoring</h1>
          <p className="page-description">
            Lihat struktur Wilayah Sungai, PLTA, serta tag dan parameter yang tersedia di server.
          </p>
        </div>

        <CatalogTabs activeView={activeView} onChange={setView} />
      </div>

      <div
        id={`catalog-panel-${activeView}`}
        role="tabpanel"
        aria-labelledby={`catalog-tab-${activeView}`}
        tabIndex={0}
        className="outline-none"
      >
        {activeView === 'ws' && <RiverBasinsCatalog />}
        {activeView === 'plta' && <PlantsCatalog onOpenTags={openTags} />}
        {activeView === 'tags' && (
          <TagsCatalog requestedPlantId={requestedPlantId} onPlantChange={openTags} />
        )}
      </div>
    </div>
  );
}
