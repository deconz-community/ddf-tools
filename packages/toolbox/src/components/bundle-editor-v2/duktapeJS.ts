export function duktapeJS() {
  return /* typescript */`
export {}

declare global {

  /**
   * Resource item object. Usualy they are created with R.item() function.
   *
   * @see {@link R.item} - Get a resource item by suffix.
   *
   * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_InitResourceItemPrototype
   */
  class RItem {
    /**
     * Get the value of the resource item.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetItemVal
     * @returns Value of the resource item.
     */
    get val(): boolean | string | number

    /**
     * Set the value of the resource item.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_SetItemVal
     *
     */
    set val(value: boolean | string | number)

    /**
     * Get the name of the resource item.
     *
     * @example
     * Get the name of the resource
     * \`\`\`
     * // 'config/offset'
     * R.item('config/offset').name;
     * \`\`\`
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetItemName
     */
    get name(): string

    /**
     * Used internally to get the resource name and value.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetResourceItem
     */
    private get ridx(): number
  }

  /**
   * Access related Resource (Device | Sensor | LightNode)
   *
   * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_InitGlobalResource
   */
  const R: {
    /**
     * Get an other resource item by suffix.
     * @param suffix - Suffix of the resource item.
     *
     * @example
     * Get the offset value from the resource
     * \`\`\`
     * // 10
     * R.item('config/offset').val;
     * \`\`\`
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetResourceItem
     *
     * @returns Resource item.
     */
    item: (suffix: string) => RItem

    /**
     * Check if a cluster is present on a specific endpoint.
     *
     * @param ep - Endpoint ID.
     * @param cluster - Cluster ID.
     * @param side - Side of the cluster, 0 for server and 1 for client
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetResourceHasCluster
     *
     * @returns True if the cluster is present, false otherwise.
     */
    hasCluster: (ep: number, cluster: number, side?: 0 | 1) => boolean

    /**
     * Return the list of endpoint IDs for a device.
     *
     * @example
     * Get the list of endpoint IDs for a device.
     * \`\`\`
     * // [1, 2]
     * const endpoints = R.endpoints
     * \`\`\`
     *
     * @example
     * Check if the resource have a specific endpoint
     * \`\`\`
     * // false
     * R.endpoints.indexOf(0x15) !== -1
     * \`\`\`
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetResourceEndpoints
     *
     * @returns List of endpoint IDs.
     */
    readonly endpoints: number[]
  }

  /**
   * Access related ResourceItem
   *
   * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_InitGlobalItem
   */
  const Item: RItem

  /**
   * Acces parsed deCONZ::ZclAttribute (if available in "parse")
   *
   * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_InitGlobalAttribute
   */

  const Attr: {
    /**
     * Get the value of the attribute.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetAttributeValue
     * @returns Value of the attribute.
     */
    readonly val: boolean | string | number | undefined

    /**
     * Get the id of the attribute.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetAttributeId
     */
    readonly id: number

    /**
     * Get the index of the attribute.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetAttributeIndex
     */
    readonly index: number

    /**
     * Get the type of the attribute.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-lib/blob/main/deconz/zcl.h} - ZclDataTypeId enum for the list of possible values.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetAttributeDataType
     */
    readonly dataType: number
  }

  /**
   * Access parsed deCONZ::ZclFrame (if available in "parse")
   *
   * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_InitGlobalZclFrame
   */
  const ZclFrame: {

    /**
     * Get the payload of the ZclFrame at a specific index.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetZclFramePayloadAt
     *
     * @param index
     * @returns Payload at the index.
     */
    at: (index: number) => number

    /**
     * Get the command ID of the ZclFrame.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetZclFrameCmd
     *
     * @returns The command ID.
     */
    readonly cmd: number

    /**
     * Get the payload size of the ZclFrame.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetZclFramePayloadSize
     *
     * @returns The payload size.
     */
    readonly payloadSize: number

    /**
     * Check if the ZclFrame is a cluster command.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_GetZclFrameIsClusterCommand
     *
     * @returns True if the ZclFrame is a cluster command, false otherwise.
     */
    readonly isClCmd: boolean
  }

  /**
   * Global Utils object.
   *
   * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_InitGlobalUtils
   */
  const Utils: {

    /**
     * Convert a string to a fixed length either by adding string at the start or truncate the string.
     *
     * @param str - String to convert.
     * @param targetLength - Target length of the string.
     * @param fillString - String to fill with, space by default.
     *
     * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DJS_UtilsPadStart
     *
     * @returns Converted string.
     */
    padStart: (str: string, targetLength: number, fillString?: string) => string

    /**
     * Get the base 10 logarithm of a number.
     * Added for legacy reasons.
     * @deprecated Use Math.log10 instead.
     */
    log10: typeof Math.log10
  }

  /**
   * Source endpoint of the device.
   *
   * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DeviceJs::evaluate
   */
  const SrcEp: number | undefined

  /**
   * Cluster ID of the device.
   *
   * @see {@link https://github.com/dresden-elektronik/deconz-rest-plugin/blob/master/device_js/device_js_duktape.cpp} - Function DeviceJs::evaluate
   */
  const ClusterId: number | undefined

}

// Polyfills added by the plugin
// eslint-disable-next-line no-extend-native
String.prototype.padStart = String.prototype.padStart || function (this: string, targetLength: number, padString?: string) {
  return Utils.padStart(this.toString(), targetLength, padString)
}

`
}
