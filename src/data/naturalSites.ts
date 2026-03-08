export type NaturalSiteCategory =
  | "park"
  | "preserve"
  | "trail"
  | "mountain"
  | "overlook";

export type NaturalSiteId =
  | "monte-sano-state-park"
  | "monte-sano-nature-preserve"
  | "green-mountain-nature-trail"
  | "chapman-mountain-nature-preserve"
  | "blevins-gap";

export type NaturalSiteFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: NaturalSiteId;
    name: string;
    category: NaturalSiteCategory;
    description: string;
  };
};

export type NaturalSiteCollection = {
  type: "FeatureCollection";
  features: NaturalSiteFeature[];
};

export const naturalSites: NaturalSiteCollection = {
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
        description:
          "Protected ridge and saddle terrain along the southern skyline, linking Jones Valley to the western mountain front."
      }
    }
  ]
};

export const naturalSiteById = new Map(
  naturalSites.features.map((feature) => [feature.properties.id, feature] as const)
);
