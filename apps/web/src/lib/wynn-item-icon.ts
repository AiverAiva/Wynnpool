/**
 * Resolve an item icon to a URL.
 *
 * Weapons (and other non-armour types) keep the pre-Fruma itemguide CDN —
 * the resource-pack dump is a 3D model atlas and looks wrong as a 2D icon.
 * Armour uses local `public/textures/wynn` textures because `armourMaterial`
 * is gone from the API; material now lives on `icon.value.name`
 * (e.g. `boots.titanium`). Pack files use netherite for titanium.
 */

export const BARRIER_ICON_SRC = '/icons/items/barrier.webp';

export type ItemIconInput = {
  icon?: {
    format?: string;
    value?: { name?: string; id?: string } | string;
  } | null;
};

const ITEMGUIDE_CDN = 'https://cdn.wynncraft.com/nextgen/itemguide/3.3';

const ARMOUR_SLOTS = new Set(['helmet', 'chestplate', 'leggings', 'boots']);

const ARMOUR_MATERIALS = new Set([
  'chainmail',
  'copper',
  'diamond',
  'gold',
  'hidden',
  'iron',
  'leather',
  'netherite',
  'pale_chainmail',
  'pale_copper',
  'pale_diamond',
  'pale_gold',
  'pale_iron',
  'pale_leather',
  'pale_netherite',
  'shaman',
  'tan',
]);

const ARMOUR_MATERIAL_REMAP: Record<string, string> = {
  titanium: 'netherite',
  pale_titanium: 'pale_netherite',
};

const SKIN_HASH = /^[a-f0-9]{64}$/i;

function itemguideUrl(iconValue: string): string {
  return `${ITEMGUIDE_CDN}/${iconValue}.webp`;
}

function resolveArmourTexture(name: string): string | null {
  const dot = name.indexOf('.');
  if (dot <= 0 || dot === name.length - 1) return null;
  const slot = name.slice(0, dot);
  const variant = name.slice(dot + 1);
  if (!ARMOUR_SLOTS.has(slot)) return null;
  const material = ARMOUR_MATERIAL_REMAP[variant] ?? variant;
  if (!ARMOUR_MATERIALS.has(material)) return null;
  return `/textures/wynn/armor/${slot}/${material}_${slot}.png`;
}

function isArmourIconName(name: string): boolean {
  const dot = name.indexOf('.');
  if (dot <= 0) return false;
  return ARMOUR_SLOTS.has(name.slice(0, dot));
}

function iconCdnValue(icon: NonNullable<ItemIconInput['icon']>): string | null {
  const { value } = icon;
  if (value && typeof value === 'object') {
    return typeof value.name === 'string' && value.name ? value.name : null;
  }
  if (typeof value !== 'string' || !value) return null;
  if (/^https?:\/\//i.test(value)) {
    const fromCdn = /itemguide\/[^/]+\/([^/?#]+?)(?:\.webp)?(?:[?#]|$)/i.exec(
      value,
    );
    return fromCdn ? decodeURIComponent(fromCdn[1]) : null;
  }
  return value.replace(':', '_');
}

export function getImageSrc(item: ItemIconInput): string {
  const icon = item.icon;
  if (!icon) return BARRIER_ICON_SRC;

  const rawValue = icon.value;
  if (
    icon.format === 'skin' ||
    (typeof rawValue === 'string' && SKIN_HASH.test(rawValue))
  ) {
    if (typeof rawValue === 'string' && rawValue) {
      return `https://mc-heads.net/head/${rawValue}`;
    }
  }

  if (icon.format === 'attribute' || icon.format === 'legacy' || !icon.format) {
    const cdnValue = iconCdnValue(icon);
    if (cdnValue) {
      const armour = resolveArmourTexture(cdnValue);
      if (armour) return armour;
      if (isArmourIconName(cdnValue)) return BARRIER_ICON_SRC;
      return itemguideUrl(cdnValue);
    }
  }

  return BARRIER_ICON_SRC;
}

export function toAbsoluteIconUrl(
  src: string,
  origin = 'https://wynnpool.com',
): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${origin}${src}`;
}
