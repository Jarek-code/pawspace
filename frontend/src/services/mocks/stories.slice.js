import { archivedStories, storyGroups } from './fixtures/stories.js';

export const storyGroupsState = storyGroups.map((group) => ({
  ...group,
  stories: group.stories.map((item) => ({ ...item, media: { ...item.media } })),
}));

export const archiveState = archivedStories.map((item) => ({
  ...item,
  media: { ...item.media },
}));
