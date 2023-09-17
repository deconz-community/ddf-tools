export const DiscoveryURL = 'https://phoscon.de/discover'
export const DefaultUsername = 'delight'
export const DefaultPassword = 'delight'

export const GatewayURITypes = ['api', 'websocket'] as const

export interface GatewayCredentials {
  id: string
  name: string
  apiKey: string
  URIs: { [key in typeof GatewayURITypes[number]]: string[] }
}

export interface GatewayURI {
  type: typeof GatewayURITypes[number]
  address: string
}

export interface WebSocketEvent {
  /** The type of the message */
  t: 'event'
  /**
   * The event type of the message:
   *    added - resource has been added;
   *    changed - resource attributes have changed;
   *    deleted - resource has been deleted.
   *    scene-called - a scene has been recalled.
   */
  e: 'added' | 'changed' | 'deleted' | 'scene-called'
  /**
   * The resource type to which the message belongs:
   *   groups - message relates to a group resource;
   *   lights - message relates to a light resource;
   *   scenes - message relates to a scene under a group resource;
   *   sensors - message relates to a sensor resource.
   */
  r: 'groups' | 'lights' | 'scenes' | 'sensors'
  /**
   * The id of the resource to which the message relates, e.g. 5 for /sensors/5.
   * Not for scene-called events.
   */
  id?: string
  /**
   * The uniqueid of the resource to which the message relates, e.g. 00:0d:6f:00:10:65:8a:6e-01-1000.
   * Only for light and sensor resources.
   */
  uniqueid?: string
  /**
   * The group id of the resource to which the message relates.
   */
  gid?: string
  /**
   * The scene id of the resource to which the message relates.
   */
  scid?: string
  /**
   * Depending on the websocketnotifyall setting: a map containing all or only the changed config attributes of a sensor resource.
   * Only for changed events.
   */
  config?: Record<string, any>
  /**
   * The (new) name of a resource.
   * Only for changed events.
   */
  name?: string
  /**
   * Not documented, list of updated attributes
   */
  attr?: Record<string, any>
  /**
   * Depending on the websocketnotifyall setting: a map containing all or only the changed state attributes of a group, light, or sensor resource.
   * Only for changed events.
   */
  state?: Record<string, any>
  /**
   * The full group resource.
   * Only for added events of a group resource.
   */
  group?: Record<string, any>
  /**
   * The full light resource.
   * Only for added events of a light resource.
   */
  light?: Record<string, any>
  /**
   * The full sensor resource.
   * Only for added events of a sensor resource.
   */
  sensor?: Record<string, any>
}
