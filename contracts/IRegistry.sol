/**
 * @dev DSNP Registry Interface
 * @dev Suggested data storage implementation:
 *   uint64 internal currentIdSequenceMarker = 0x1; // Must not start at 0
 *   mapping(string => [id, address]) internal handleToIdAndAddress;
 */
interface IRegistry {

    /**
     * @dev Log when a resolution address is changed
     * @param id The DSNP Id 
     * @param addr The address the DSNP Id is pointing at
     * @param handle The actual UTF-8 string used for the handle 
     */
    event DSNPRegistryUpdate(uint64 indexed id, address indexed addr, string indexed handle);

    /**
     * @dev Register a new DSNP Id
     * @param addr Address for the new DSNP Id to point at
     * @param handle The handle for discovery
     * 
     * MUST reject if the handle is already in use
     * MUST be called by someone who is authorized on the contract
     *      via `IDelegation(addr).isAuthorizedTo(msg.sender, Permission.OWNERSHIP_TRANSFER, block.number)`
     * MUST emit DSNPRegistryUpdate
     */
    function register(address addr, string calldata handle) external returns (uint64);

    /**
     * @dev Alter a DSNP Id resolution address
     * @param newAddr Original or new address to resolve to
     * @param handle The handle to modify
     * 
     * MUST be called by someone who is authorized on the contract
     *      via `IDelegation(oldAddr).isAuthorizedTo(oldAddr, Permission.OWNERSHIP_TRANSFER, block.number)`
     * MUST emit DSNPRegistryUpdate
     */
    function changeAddress(address newAddr, string calldata handle) external;

    /**
     * @dev Alter a DSNP Id handle
     * @param oldHandle The previous handle for modification
     * @param newHandle The new handle to use for discovery
     * 
     * MUST NOT allow a registration of a handle that is already in use
     * MUST be called by someone who is authorized on the contract
     *      via `IDelegation(oldHandle -> addr).isAuthorizedTo(ecrecovedAddr, Permission.OWNERSHIP_TRANSFER, block.number)`
     * MUST emit DSNPRegistryUpdate
     */
    function changeHandle(string calldata oldHandle, string calldata newHandle) external;

    /**
     * @dev Resolve a handle to a contract address
     * @param handle The handle to resolve
     * 
     * @return Address of the contract
     */
    function resolveHandleToAddress(string calldata handle) view external returns (address);

    /**
     * @dev Resolve a handle to a DSNP Id
     * @param handle The handle to resolve
     * 
     * @return DSNP Id
     */
    function resolveHandleToId(string calldata handle) view external returns (uint64);
}