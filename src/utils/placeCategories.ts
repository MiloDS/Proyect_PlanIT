import {
  Clapperboard,
  Coffee,
  Landmark,
  LucideIcon,
  MapPin,
  ShoppingBag,
  Trees,
  UtensilsCrossed,
} from 'lucide-react-native';

import { colors } from '../styles/colors';

type PlaceCategoryStyle = {
  Icon: LucideIcon;
  color: string;
};

// Tipos de Google Places (tabla A) agrupados por el ícono que los representa
const CATEGORY_GROUPS: { types: string[]; style: PlaceCategoryStyle }[] = [
  {
    types: [
      'park',
      'campground',
      'zoo',
      'national_park',
      'hiking_area',
      'garden',
      'botanical_garden',
    ],
    style: { Icon: Trees, color: colors.categoryNature },
  },
  {
    types: ['cafe', 'coffee_shop', 'bakery', 'tea_house'],
    style: { Icon: Coffee, color: colors.categoryFood },
  },
  {
    types: ['restaurant', 'bar', 'pub', 'food_court'],
    style: { Icon: UtensilsCrossed, color: colors.categoryFood },
  },
  {
    types: ['museum', 'art_gallery', 'library', 'tourist_attraction', 'historical_landmark'],
    style: { Icon: Landmark, color: colors.categoryCulture },
  },
  {
    types: ['movie_theater', 'amusement_park', 'bowling_alley', 'night_club'],
    style: { Icon: Clapperboard, color: colors.categoryEntertainment },
  },
  {
    types: ['shopping_mall'],
    style: { Icon: ShoppingBag, color: colors.categoryEntertainment },
  },
];

const DEFAULT_STYLE: PlaceCategoryStyle = { Icon: MapPin, color: colors.categoryOther };

/**
 * Ícono y color de un lugar según su tipo principal de Google (por ejemplo "park").
 * Los tipos específicos ("italian_restaurant") se agrupan por su sufijo.
 */
export function getPlaceCategoryStyle(type: string | null): PlaceCategoryStyle {
  if (!type) return DEFAULT_STYLE;
  const group = CATEGORY_GROUPS.find(({ types }) =>
    types.some((candidate) => type === candidate || type.endsWith(`_${candidate}`))
  );
  return group?.style ?? DEFAULT_STYLE;
}
