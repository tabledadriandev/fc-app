// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TANFT
 * @notice ERC721 NFT contract for Table d'Adrian DeSci Collection
 * @dev Mints NFTs with custom tokenURI, sends payment to liquidity pool
 */
contract TANFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    uint256 public constant MINT_PRICE = 0.003 ether; // 0.003 ETH
    uint256 public constant MAX_SUPPLY = 1000;
    address public liquidityPool;
    
    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event LiquidityPoolUpdated(address indexed oldPool, address indexed newPool);

    constructor(
        address initialOwner,
        address _liquidityPool
    ) ERC721("Table d'Adrian DeSci Collection", "TADSC") Ownable(initialOwner) {
        liquidityPool = _liquidityPool;
        _tokenIdCounter = 1; // Start from token ID 1
    }

    /**
     * @notice Mint an NFT to the specified address
     * @param to Address to mint the NFT to
     * @param tokenURI URI pointing to the NFT metadata/image
     * @return tokenId The ID of the newly minted NFT
     */
    function mint(address to, string memory tokenURI) 
        external 
        payable 
        nonReentrant 
        returns (uint256) 
    {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(_tokenIdCounter <= MAX_SUPPLY, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Send payment to liquidity pool
        if (liquidityPool != address(0)) {
            (bool success, ) = liquidityPool.call{value: msg.value}("");
            require(success, "Payment transfer failed");
        }

        emit Minted(to, tokenId, tokenURI);
        return tokenId;
    }

    /**
     * @notice Update the liquidity pool address (owner only)
     */
    function setLiquidityPool(address _liquidityPool) external onlyOwner {
        address oldPool = liquidityPool;
        liquidityPool = _liquidityPool;
        emit LiquidityPoolUpdated(oldPool, _liquidityPool);
    }

    /**
     * @notice Get the current token ID counter
     */
    function currentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Get total supply (minted tokens)
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @notice Withdraw contract balance (owner only, emergency)
     */
    function withdraw() external onlyOwner nonReentrant {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}

