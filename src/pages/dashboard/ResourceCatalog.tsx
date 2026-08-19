import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
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
      <PageHeader
        title="Katalog Monitoring"
        description="Lihat struktur Wilayah Sungai, PLTA, serta tag dan parameter yang tersedia di server."
        actions={<CatalogTabs activeView={activeView} onChange={setView} />}
      />

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
