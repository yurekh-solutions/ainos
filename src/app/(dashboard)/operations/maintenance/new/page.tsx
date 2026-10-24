'use client';

import AssetForm, { emptyAsset } from '../asset-form';

export default function NewAssetPage() {
  return <AssetForm mode="create" initial={emptyAsset} />;
}
