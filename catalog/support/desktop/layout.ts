/** One existing empty workspace leaf; no unrelated panels or document. */
export function reviewLayout() {
  const sidebar = (id: string) => ({
    id,
    type: "split",
    direction: "horizontal",
    sizes: [],
    children: [],
    width: "0rem",
  });
  return {
    main: {
      id: "main",
      type: "split",
      direction: "horizontal",
      sizes: [100],
      children: [
        {
          id: "review-tabs",
          type: "tabs",
          stacked: false,
          currentTab: 0,
          children: [
            {
              id: "review-empty",
              type: "leaf",
              state: {
                type: "empty",
                state: {},
                title: "New Tab",
                icon: "file",
              },
            },
          ],
        },
      ],
    },
    left: sidebar("left"),
    right: sidebar("right"),
    bottom: {
      id: "bottom-panel",
      type: "tabs",
      stacked: false,
      currentTab: 0,
      children: [],
      height: "0px",
    },
    floating: [],
    active: "review-empty",
  };
}
