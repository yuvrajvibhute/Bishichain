// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title TrustSBT
/// @notice Soulbound ERC-721 that tracks on-chain reputation for Bhishi circle members.
///         tokenId = uint160(memberAddress) — one token per address forever.
///         Only authorized circles (set by the factory) may write score records.
///         Transfers are permanently disabled; only minting is allowed.
contract TrustSBT is ERC721 {
    using Strings for uint256;
    using Strings for int256;

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────
    error Soulbound();
    error NotAuthorized();
    error NotFactory();

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public immutable factory;

    /// @notice Circles that are allowed to write reputation records.
    mapping(address circle => bool) public authorizedCircles;

    struct Record {
        uint32 completed;  // circles fully participated in
        uint32 onTime;     // rounds paid on time across all circles
        uint32 defaults;   // rounds missed (slashed) across all circles
    }

    /// @notice tokenId => reputation record. tokenId = uint160(member).
    mapping(uint256 tokenId => Record) public records;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────
    event CircleAuthorized(address indexed circle);
    event RecordWritten(address indexed member, uint32 onTime, uint32 defaults);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────
    constructor(address _factory) ERC721("Bhishi Trust Score", "BHISHI") {
        factory = _factory;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Factory-only
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Called by the factory when deploying a new Circle.
    function authorizeCircle(address circle) external {
        if (msg.sender != factory) revert NotFactory();
        authorizedCircles[circle] = true;
        emit CircleAuthorized(circle);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Circle-only writes
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Called by an authorized Circle at completion to record final stats.
    /// @param member   The circle member whose record is updated.
    /// @param onTime   Rounds paid on time in this circle.
    /// @param defaults Rounds defaulted in this circle.
    function writeRecord(address member, uint32 onTime, uint32 defaults) external {
        if (!authorizedCircles[msg.sender]) revert NotAuthorized();

        uint256 tokenId = uint256(uint160(member));
        Record storage r = records[tokenId];

        // Mint on first interaction
        if (_ownerOf(tokenId) == address(0)) {
            _safeMint(member, tokenId);
        }

        unchecked {
            r.completed += 1;
            r.onTime    += onTime;
            r.defaults  += defaults;
        }

        emit RecordWritten(member, onTime, defaults);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Returns the trust score: onTime*10 - defaults*50. Can be negative.
    function score(address member) external view returns (int256) {
        uint256 tokenId = uint256(uint160(member));
        Record memory r = records[tokenId];
        return int256(uint256(r.onTime)) * 10 - int256(uint256(r.defaults)) * 50;
    }

    /// @notice Returns full record for a member.
    function getRecord(address member)
        external
        view
        returns (uint32 completed, uint32 onTime, uint32 defaults)
    {
        uint256 tokenId = uint256(uint160(member));
        Record memory r = records[tokenId];
        return (r.completed, r.onTime, r.defaults);
    }

    /// @notice On-chain SVG metadata — fully base64-encoded JSON.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        Record memory r = records[tokenId];
        int256 s = int256(uint256(r.onTime)) * 10 - int256(uint256(r.defaults)) * 50;
        address owner = _ownerOf(tokenId);
        string memory addrStr = Strings.toHexString(uint160(owner), 20);

        string memory svg = _buildSVG(addrStr, s, r);
        string memory json = string(abi.encodePacked(
            '{"name":"Bhishi Trust Score #',
            tokenId.toString(),
            '","description":"Soulbound trust score for Bhishi chit-fund circles.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '","attributes":[',
            '{"trait_type":"Score","value":', _intToString(s), '},',
            '{"trait_type":"Circles Completed","value":', uint256(r.completed).toString(), '},',
            '{"trait_type":"On-Time Payments","value":', uint256(r.onTime).toString(), '},',
            '{"trait_type":"Defaults","value":', uint256(r.defaults).toString(), '}',
            ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Soulbound: block all transfers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Override _update to block all transfers; only minting (from == address(0)) is allowed.
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert Soulbound(); // block transfers and burns
        return super._update(to, tokenId, auth);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal SVG builder
    // ─────────────────────────────────────────────────────────────────────────

    function _buildSVG(
        string memory addrStr,
        int256 s,
        Record memory r
    ) internal pure returns (string memory) {
        // Score colour: green if >= 0, red if negative
        string memory scoreColor = s >= 0 ? "#2D7A4F" : "#C1291B";
        string memory scoreStr = _intToString(s);

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<defs>',
            '<pattern id="grain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">',
            '<rect width="4" height="4" fill="#F6F0E4"/>',
            '<circle cx="1" cy="1" r="0.5" fill="#15120E" opacity="0.05"/>',
            '</pattern>',
            '</defs>',
            // Background
            '<rect width="400" height="400" fill="url(#grain)" rx="8"/>',
            '<rect width="400" height="400" fill="#F6F0E4" rx="8" opacity="0.9"/>',
            // Border
            '<rect x="2" y="2" width="396" height="396" rx="6" fill="none" stroke="#15120E" stroke-width="2"/>',
            // Hard shadow accent rect
            '<rect x="8" y="8" width="384" height="80" rx="4" fill="#F2A900"/>',
            '<rect x="10" y="10" width="384" height="80" rx="4" fill="#F2A900" stroke="#15120E" stroke-width="2"/>',
            // Title
            '<text x="200" y="40" font-family="serif" font-size="22" font-weight="700" fill="#15120E" text-anchor="middle">BHISHI</text>',
            '<text x="200" y="60" font-family="serif" font-size="11" fill="#15120E" text-anchor="middle" letter-spacing="3">TRUST SCORE</text>',
            // Score big number
            '<text x="200" y="165" font-family="monospace" font-size="88" font-weight="900" fill="',
            scoreColor,
            '" text-anchor="middle">',
            scoreStr,
            '</text>',
            // Divider
            '<line x1="40" y1="190" x2="360" y2="190" stroke="#15120E" stroke-width="1.5" stroke-dasharray="4,4"/>',
            // Stats
            '<text x="80" y="230" font-family="sans-serif" font-size="11" fill="#15120E" text-anchor="middle" opacity="0.6">CIRCLES</text>',
            '<text x="80" y="255" font-family="monospace" font-size="28" font-weight="700" fill="#15120E" text-anchor="middle">',
            uint256(r.completed).toString(),
            '</text>',
            '<text x="200" y="230" font-family="sans-serif" font-size="11" fill="#15120E" text-anchor="middle" opacity="0.6">ON TIME</text>',
            '<text x="200" y="255" font-family="monospace" font-size="28" font-weight="700" fill="#2D7A4F" text-anchor="middle">',
            uint256(r.onTime).toString(),
            '</text>',
            '<text x="320" y="230" font-family="sans-serif" font-size="11" fill="#15120E" text-anchor="middle" opacity="0.6">DEFAULTS</text>',
            '<text x="320" y="255" font-family="monospace" font-size="28" font-weight="700" fill="#C1291B" text-anchor="middle">',
            uint256(r.defaults).toString(),
            '</text>',
            // Address
            '<text x="200" y="310" font-family="monospace" font-size="9" fill="#15120E" text-anchor="middle" opacity="0.5">',
            addrStr,
            '</text>',
            // Bottom badge
            '<rect x="120" y="330" width="160" height="40" rx="4" fill="#15120E"/>',
            '<rect x="122" y="332" width="160" height="40" rx="4" fill="#15120E"/>',
            '<rect x="120" y="328" width="160" height="40" rx="4" fill="#F2A900" stroke="#15120E" stroke-width="2"/>',
            '<text x="200" y="353" font-family="sans-serif" font-size="12" font-weight="700" fill="#15120E" text-anchor="middle">SOULBOUND</text>',
            '</svg>'
        ));
    }

    function _intToString(int256 value) internal pure returns (string memory) {
        if (value < 0) {
            return string(abi.encodePacked("-", uint256(-value).toString()));
        }
        return uint256(value).toString();
    }
}
