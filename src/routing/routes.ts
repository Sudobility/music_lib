/**
 * The shared route registry both apps are built on.
 *
 * These are the routes the web app and the React Native app have in common —
 * names, path patterns and param shapes — in one place so the two cannot drift.
 * Each app binds its own navigator to this registry (react-router on web,
 * react-navigation on native) and extends it with its own extra routes via
 * `@sudobility/routing`'s `extendRoutes`: the web app adds its content screens
 * (home, resources, legal, the standalone print page…), while native folds
 * several of those into Settings sections.
 *
 * Framework-agnostic on purpose — this file imports no navigation library, so
 * it stays in music_lib (business logic) rather than either app. Paths carry no
 * `/:lang` prefix: localisation of the URL is an app concern (the web app nests
 * everything under `/:lang`; native strips an optional language segment).
 */
import { defineRoutes, route, type Navigator } from '@sudobility/routing';

export const musicRoutes = defineRoutes({
  /** The reader's projects (the RN "Dashboard"/Projects tab). */
  projects: route('/projects'),
  /**
   * The editor; a project id, or none for a local scratch document. The path is
   * `/project/:projectId` — what both apps already use (web's `/project/:id`,
   * native's `project/:projectId` deep link) — not `/editor`.
   */
  editor: route<{ projectId?: string }>('/project/:projectId?'),
  /** A published score, read-only, by its public id. */
  published: route<{ publicId: string }>('/p/:publicId'),
  community: route('/community'),
  /** Documentation, optionally opened on a topic. */
  docs: route<{ topicId?: string }>('/docs/:topicId?'),
  resources: route('/resources'),
  settings: route('/settings'),
  credits: route('/credits'),
});

/** The shared route map, for an app extending or navigating it. */
export type MusicRoutes = typeof musicRoutes.routes;

/** The navigation contract shared UI depends on, over the shared routes. */
export type MusicNavigator = Navigator<MusicRoutes>;
