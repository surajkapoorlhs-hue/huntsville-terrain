export type CuratedPlaceType = "nature" | "practical";

export type CuratedPlaceCategory =
  | "park"
  | "preserve"
  | "trail"
  | "mountain"
  | "overlook"
  | "hospital";

export type CuratedPlaceId =
  | "monte-sano-state-park"
  | "monte-sano-nature-preserve"
  | "green-mountain-nature-trail"
  | "chapman-mountain-nature-preserve"
  | "blevins-gap"
  | "crestwood-medical-center"
  | "huntsville-hospital";

export type CuratedPlaceFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: CuratedPlaceId;
    name: string;
    category: CuratedPlaceCategory;
    placeType: CuratedPlaceType;
    description: string;
    address?: string;
  };
};

export type CuratedPlaceCollection = {
  type: "FeatureCollection";
  features: CuratedPlaceFeature[];
};

export const curatedPlaces: CuratedPlaceCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-86.5313, 34.7445]
      },
      properties: {
        id: "monte-sano-state-park",
        name: "Monte Sano State Park",
        category: "park",
        placeType: "nature",
        description:
          "The signature ridge-top park east of downtown, with overlooks and trail access across Monte Sano."
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-86.5472, 34.7368]
      },
      properties: {
        id: "monte-sano-nature-preserve",
        name: "Monte Sano Nature Preserve",
        category: "preserve",
        placeType: "nature",
        description:
          "Land Trust preserve connecting the mountain's western and southern slopes through dense trail networks."
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-86.5004, 34.6511]
      },
      properties: {
        id: "green-mountain-nature-trail",
        name: "Green Mountain Nature Trail",
        category: "trail",
        placeType: "nature",
        description:
          "A high-elevation Green Mountain stop with a lake, wooded walking loop, and broad terrain context above Hampton Cove."
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-86.501, 34.7601]
      },
      properties: {
        id: "chapman-mountain-nature-preserve",
        name: "Chapman Mountain Nature Preserve",
        category: "preserve",
        placeType: "nature",
        description:
          "A steep preserve on Huntsville's northeast edge, preserving the mountain front and key valley views."
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-86.5943, 34.6941]
      },
      properties: {
        id: "blevins-gap",
        name: "Blevins Gap",
        category: "preserve",
        placeType: "nature",
        description:
          "Protected ridge and saddle terrain along the southern skyline, linking Jones Valley to the western mountain front."
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-86.5727494, 34.694121]
      },
      properties: {
        id: "crestwood-medical-center",
        name: "Crestwood Medical Center",
        category: "hospital",
        placeType: "practical",
        address: "1 Hospital Drive SW, Huntsville, AL 35801",
        description:
          "South-central medical campus near Jones Valley and Memorial Parkway, useful as a practical anchor while comparing homes."
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-86.5809629, 34.7204666]
      },
      properties: {
        id: "huntsville-hospital",
        name: "Huntsville Hospital",
        category: "hospital",
        placeType: "practical",
        address: "101 Sivley Road SW, Huntsville, AL 35801",
        description:
          "Major Medical District hospital just south of downtown, useful as a practical anchor for commute and care access."
      }
    }
  ]
};

export const naturalPlaces: CuratedPlaceCollection = {
  type: "FeatureCollection",
  features: curatedPlaces.features.filter(
    (feature) => feature.properties.placeType === "nature"
  )
};

export const practicalPlaces: CuratedPlaceCollection = {
  type: "FeatureCollection",
  features: curatedPlaces.features.filter(
    (feature) => feature.properties.placeType === "practical"
  )
};

export const curatedPlaceById = new Map(
  curatedPlaces.features.map((feature) => [feature.properties.id, feature] as const)
);
