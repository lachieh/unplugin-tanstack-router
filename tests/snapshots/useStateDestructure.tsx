const $$splitComponentImporter = () => import('tsr-split:useStateDestructure.tsx?tsr-split');
import { lazyRouteComponent } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { startProject } from '~/projects/start';
import { seo } from '~/utils/seo';
export const Route = createFileRoute('/_libraries/start/$version/')({
  component: lazyRouteComponent($$splitComponentImporter, 'component'),
  meta: () => seo({
    title: startProject.name,
    description: startProject.description
  })
});