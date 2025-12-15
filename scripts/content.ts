import { detectClickables } from './detector';
import { renderOverlays } from './overlay';

function run(): void {
  const clickables = detectClickables();
  renderOverlays(clickables);
}

run();
