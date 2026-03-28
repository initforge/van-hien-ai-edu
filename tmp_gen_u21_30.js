const fs = require('fs');
const path = require('path');

const outPath = 'P:/edupath_english/api/src/db/seeds/fix_remaining_u21_30.sql';

const sql = `-- Fix vocab encoding: Units 21-30

-- Unit 21
UPDATE vocabulary SET phonetic = '/\u0259d\u02c8ma\u026a\u0259r/', meaning = 'ng\u01b0\u1ee1ng m\u1ed9' WHERE id = 107;
UPDATE vocabulary SET phonetic = '/\u02ccdedi\u02c8ke\u026a\u0283n/', meaning = 's\u1ef1 c\u1ed1ng hi\u1ebfn' WHERE id = 109;
UPDATE vocabulary SET phonetic = '/\u02cc\u026ansp\u026a\u02c8re\u026a\u0283n/', meaning = 'ngu\u1ed3n c\u1ea3m h\u1ee9ng' WHERE id = 112;
UPDATE vocabulary SET phonetic = '/ro\u028al \u02c8m\u0252dl/', meaning = 'h\u00ecnh m\u1eabu' WHERE id = 1637;
UPDATE vocabulary SET phonetic = '/f\u026a\u02c8l\u00e6n\u03b8r\u0259p\u026ast/', meaning = 'nh\u00e0 t\u1eeb thi\u1ec7n' WHERE id = 1639;
UPDATE vocabulary SET phonetic = '/\u02c8v\u026a\u0292\u0259neri/', meaning = 'ng\u01b0\u1eddi c\u00f3 t\u1ea7m nh\u00ecn' WHERE id = 1640;
UPDATE vocabulary SET phonetic = '/r\u026a\u02c8z\u026ali\u0259nt/', meaning = 'ki\u00ean c\u01b0\u1eddng' WHERE id = 1641;
UPDATE vocabulary SET phonetic = '/\u026an\u02c8te\u0261r\u0259ti/', meaning = 'ch\u00ednh tr\u1ef1c' WHERE id = 1642;
UPDATE vocabulary SET phonetic = '/k\u0259m\u02c8p\u00e6\u0283n/', meaning = 'l\u00f2ng tr\u1eafc \u1ea9n' WHERE id = 1643;
UPDATE vocabulary SET phonetic = '/\u02c8le\u0261\u0259si/', meaning = 'di s\u1ea3n' WHERE id = 1645;
UPDATE vocabulary SET phonetic = '/\u02c8ma\u026alsto\u028an/', meaning = 'c\u1ed9t m\u1ed1c' WHERE id = 1646;
UPDATE vocabulary SET phonetic = '/\u02c8bre\u026ak\u03b8ru\u02d0/', meaning = 'b\u01b0\u1edbc \u0111\u1ed9t ph\u00e1' WHERE id = 1647;
UPDATE vocabulary SET phonetic = '/\u02cck\u0252ntr\u026a\u02c8bju\u02d0\u0283n/', meaning = '\u0111\u00f3ng g\u00f3p' WHERE id = 1648;
UPDATE vocabulary SET phonetic = '/\u02cc\u028ao\u028av\u0259r\u02c8k\u028am/', meaning = 'v\u01b0\u1ee3t qua' WHERE id = 1649;
UPDATE vocabulary SET phonetic = '/\u02c8ment\u0254\u02d0r/', meaning = 'ng\u01b0\u1eddi c\u1ed1 v\u1ea5n' WHERE id = 1650;
UPDATE vocabulary SET phonetic = '/k\u0259\u02c8m\u026atm\u0259nt/', meaning = 'cam k\u1ebft' WHERE id = 1651;
UPDATE vocabulary SET phonetic = '/\u02c8d\u026as\u0259pl\u026an/', meaning = 'k\u1ef7 lu\u1eadt' WHERE id = 1652;
UPDATE vocabulary SET phonetic = '/\u02cc\u00e6sp\u026a\u02c8re\u026a\u0283n/', meaning = 'kh\u00e1t v\u1ecdng' WHERE id = 1653;
UPDATE vocabulary SET phonetic = '/hju\u02d0\u02c8m\u026al\u0259ti/', meaning = 'khi\u00eam t\u1ed1n' WHERE id = 1654;
UPDATE vocabulary SET phonetic = '/k\u0259\u02c8re\u026ad\u0292\u0259s/', meaning = 'd\u0169ng c\u1ea3m' WHERE id = 1655;
UPDATE vocabulary SET phonetic = '/\u02cc\u026anflu\u02c8en\u0283l/', meaning = 'c\u00f3 \u1ea3nh h\u01b0\u1edfng' WHERE id = 1656;
UPDATE vocabulary SET phonetic = '/\u02c8selfl\u0259sn\u0259s/', meaning = '\u0111\u1ee9c t\u00ednh v\u1ecb tha' WHERE id = 1657;
UPDATE vocabulary SET phonetic = '/\u02cc\u026ansp\u026a\u02c8re\u026a\u0283n s\u0254\u02d0rs/', meaning = 'ngu\u1ed3n truy\u1ec1n c\u1ea3m h\u1ee9ng' WHERE id = 1659;
UPDATE vocabulary SET phonetic = '/\u02c8tre\u026al\u02ccble\u026az\u0259r/', meaning = 'ng\u01b0\u1eddi ti\u00ean phong' WHERE id = 1660;

-- Unit 22
UPDATE vocabulary SET phonetic = '/\u02ccm\u028alti\u02c8k\u028alt\u0283\u0259r\u0259l/', meaning = '\u0111a v\u0103n h\u00f3a' WHERE id = 113;
UPDATE vocabulary SET phonetic = '/\u02c8fest\u026avl/', meaning = 'l\u1ec5 h\u1ed9i' WHERE id = 118;
UPDATE vocabulary SET phonetic = '/da\u026a\u02c8v\u025c\u02d0rs\u0259ti/', meaning = 's\u1ef1 \u0111a d\u1ea1ng' WHERE id = 1661;
UPDATE vocabulary SET phonetic = '/\u02c8her\u026at\u026ad\u0292/', meaning = 'di s\u1ea3n' WHERE id = 1663;
UPDATE vocabulary SET phonetic = '/tr\u0259\u02c8d\u026a\u0283n/', meaning = 'truy\u1ec1n th\u1ed1ng' WHERE id = 1664;
UPDATE vocabulary SET phonetic = '/kw\u026a\u02c8zi\u02d0n/', meaning = '\u1ea9m th\u1ef1c' WHERE id = 1665;
UPDATE vocabulary SET phonetic = '/\u02c8l\u00e6\u014b\u0261w\u026ad\u0292 \u02c8b\u00e6ri\u0259r/', meaning = 'r\u00e0o c\u1ea3n ng\u00f4n ng\u1eef' WHERE id = 1666;
UPDATE vocabulary SET phonetic = '/\u026an\u02c8klu\u02d0\u0292n/', meaning = 's\u1ef1 h\u00f2a nh\u1eadp' WHERE id = 1667;
UPDATE vocabulary SET phonetic = '/\u02c8steri\u0259ta\u026ap/', meaning = '\u0111\u1ecbnh ki\u1ebfn khu\u00f4n m\u1eabu' WHERE id = 1668;
UPDATE vocabulary SET phonetic = '/\u02c8pred\u0292\u028ad\u026as/', meaning = 'th\u00e0nh ki\u1ebfn' WHERE id = 1669;
UPDATE vocabulary SET phonetic = '/\u02cc\u026ant\u026a\u02c8\u0261re\u026a\u0283n/', meaning = 's\u1ef1 h\u1ed9i nh\u1eadp' WHERE id = 1670;
UPDATE vocabulary SET phonetic = '/\u02c8k\u028alt\u0283\u0259r\u0259l \u026aks\u02c8t\u0283e\u026and\u0292/', meaning = 'giao l\u01b0u v\u0103n h\u00f3a' WHERE id = 1671;
UPDATE vocabulary SET phonetic = '/\u026an\u02c8d\u026ad\u0292\u0259n\u0259s/', meaning = 'b\u1ea3n \u0111\u1ecba' WHERE id = 1673;
UPDATE vocabulary SET phonetic = '/\u02c8et\u026aket/', meaning = 'ph\u00e9p l\u1ecbch s\u1ef1' WHERE id = 1674;
UPDATE vocabulary SET phonetic = '/b\u026a\u02c8li\u02d0f \u02c8s\u026ast\u0259m/', meaning = 'h\u1ec7 th\u1ed1ng ni\u1ec1m tin' WHERE id = 1675;
UPDATE vocabulary SET phonetic = '/\u02c8w\u025c\u02d0rldvju\u02d0/', meaning = 'th\u1ebf gi\u1edbi quan' WHERE id = 1676;
UPDATE vocabulary SET phonetic = '/\u02ccko\u028a\u026a\u0261\u02c8z\u026ast\u0259ns/', meaning = 's\u1ef1 c\u00f9ng t\u1ed3n t\u1ea1i' WHERE id = 1677;
UPDATE vocabulary SET phonetic = '/ma\u026a\u02c8\u0261re\u026a\u0283n/', meaning = 'di c\u01b0' WHERE id = 1678;
UPDATE vocabulary SET phonetic = '/da\u026a\u02c8\u00e6sp\u0259r\u0259/', meaning = 'c\u1ed9ng \u0111\u1ed3ng xa x\u1ee9' WHERE id = 1679;

-- Unit 23
UPDATE vocabulary SET phonetic = '/s\u0259\u02c8ste\u026an\u0259bl/', meaning = 'b\u1ec1n v\u1eefng' WHERE id = 1680;
UPDATE vocabulary SET phonetic = '/\u02c8\u028ap\u02ccsa\u026akl/', meaning = 't\u00e1i s\u1eed d\u1ee5ng s\u00e1ng t\u1ea1o' WHERE id = 1683;
UPDATE vocabulary SET phonetic = '/\u02c8z\u026a\u0259ro\u028a we\u026ast/', meaning = 'kh\u00f4ng r\u00e1c th\u1ea3i' WHERE id = 1685;
UPDATE vocabulary SET phonetic = '/\u02cck\u0252ns\u0259r\u02c8ve\u026a\u0283n/', meaning = 'b\u1ea3o t\u1ed3n' WHERE id = 1686;
UPDATE vocabulary SET phonetic = '/\u02c8en\u0259rd\u0292i \u026a\u02c8f\u026a\u0283nt/', meaning = 'ti\u1ebft ki\u1ec7m n\u0103ng l\u01b0\u1ee3ng' WHERE id = 1687;
UPDATE vocabulary SET phonetic = '/\u026a\u02c8m\u026a\u0283n/', meaning = 'kh\u00ed th\u1ea3i' WHERE id = 1688;
UPDATE vocabulary SET phonetic = '/\u02c8kla\u026am\u0259t \u02c8\u00e6k\u0283n/', meaning = 'h\u00e0nh \u0111\u1ed9ng v\u00ec kh\u00ed h\u1eadu' WHERE id = 1689;
UPDATE vocabulary SET phonetic = '/\u0259\u02ccf\u0252r\u026a\u02c8ste\u026a\u0283n/', meaning = 'tr\u1ed3ng r\u1eebng m\u1edbi' WHERE id = 1690;
UPDATE vocabulary SET phonetic = '/\u02ccdi\u02d0\u02ccf\u0252r\u026a\u02c8ste\u026a\u0283n/', meaning = 'n\u1ea1n ph\u00e1 r\u1eebng' WHERE id = 1691;
UPDATE vocabulary SET phonetic = '/ri\u02d0\u02c8sa\u026akl\u026a\u014b/', meaning = 't\u00e1i ch\u1ebf' WHERE id = 1692;
UPDATE vocabulary SET phonetic = '/ri\u02d0\u02c8ju\u02d0z\u0259bl/', meaning = 'c\u00f3 th\u1ec3 t\u00e1i s\u1eed d\u1ee5ng' WHERE id = 1693;
UPDATE vocabulary SET phonetic = '/\u02c8p\u028abl\u026ak \u02c8tr\u00e6nsp\u0254\u02d0rt/', meaning = 'ph\u01b0\u01a1ng ti\u1ec7n c\u00f4ng c\u1ed9ng' WHERE id = 1694;
UPDATE vocabulary SET phonetic = '/\u0261ri\u02d0n spe\u026as/', meaning = 'kh\u00f4ng gian xanh' WHERE id = 1695;
UPDATE vocabulary SET phonetic = '/\u02c8w\u0254\u02d0t\u0259r \u02c8se\u026av\u026a\u014b/', meaning = 'ti\u1ebft ki\u1ec7m n\u01b0\u1edbc' WHERE id = 1696;
UPDATE vocabulary SET phonetic = '/\u02c8s\u025c\u02d0rkj\u0259l\u0259r \u026a\u02c8k\u0252n\u0259mi/', meaning = 'kinh t\u1ebf tu\u1ea7n ho\u00e0n' WHERE id = 1697;
UPDATE vocabulary SET phonetic = '/w\u026and \u02c8t\u025c\u02d0rba\u026an/', meaning = 'tuabin gi\u00f3' WHERE id = 1698;
UPDATE vocabulary SET phonetic = '/\u026an\u02ccva\u026ar\u0259n\u02c8mentl \u0259\u02c8we\u0259n\u0259s/', meaning = 'nh\u1eadn th\u1ee9c m\u00f4i tr\u01b0\u1eddng' WHERE id = 1699;

-- Unit 24
UPDATE vocabulary SET phonetic = '/\u02cc\u025c\u02d0rb\u0259na\u026a\u02c8ze\u026a\u0283n/', meaning = '\u0111\u00f4 th\u1ecb h\u00f3a' WHERE id = 125;
UPDATE vocabulary SET phonetic = '/m\u0259\u02c8tr\u0252p\u0259l\u026as/', meaning = '\u0111\u00f4 th\u1ecb l\u1edbn' WHERE id = 1700;
UPDATE vocabulary SET phonetic = '/\u02c8\u026anfr\u0259str\u028akt\u0283\u0259r/', meaning = 'c\u01a1 s\u1edf h\u1ea1 t\u1ea7ng' WHERE id = 1701;
UPDATE vocabulary SET phonetic = '/\u02c8ha\u028az\u026a\u014b \u02c8\u0283\u0254\u02d0rt\u026ad\u0292/', meaning = 'thi\u1ebfu nh\u00e0 \u1edf' WHERE id = 1702;
UPDATE vocabulary SET phonetic = '/\u02c8r\u028ar\u0259l \u02c8\u025c\u02d0rb\u0259n ma\u026a\u02c8\u0261re\u026a\u0283n/', meaning = 'di c\u01b0 n\u00f4ng th\u00f4n ra th\u00e0nh th\u1ecb' WHERE id = 1703;
UPDATE vocabulary SET phonetic = '/s\u0259\u02c8b\u025c\u02d0rb\u0259n/', meaning = 'thu\u1ed9c ngo\u1ea1i \u00f4' WHERE id = 1704;
UPDATE vocabulary SET phonetic = '/p\u0259\u02c8lu\u02d0\u0283n \u02c8h\u0252tsp\u0252t/', meaning = '\u0111i\u1ec3m n\u00f3ng \u00f4 nhi\u1ec5m' WHERE id = 1705;
UPDATE vocabulary SET phonetic = '/\u02c8p\u028abl\u026ak \u02c8tr\u00e6nz\u026at/', meaning = 'giao th\u00f4ng c\u00f4ng c\u1ed9ng' WHERE id = 1706;
UPDATE vocabulary SET phonetic = '/sl\u028am/', meaning = 'khu \u1ed5 chu\u1ed9t' WHERE id = 1708;
UPDATE vocabulary SET phonetic = '/\u02c8\u025c\u02d0rb\u0259n spr\u0254\u02d0l/', meaning = 's\u1ef1 \u0111\u00f4 th\u1ecb h\u00f3a lan r\u1ed9ng' WHERE id = 1709;
UPDATE vocabulary SET phonetic = '/sm\u0251\u02d0rt \u02c8s\u026ati/', meaning = 'th\u00e0nh ph\u1ed1 th\u00f4ng minh' WHERE id = 1711;
UPDATE vocabulary SET phonetic = '/\u02ccd\u0292entr\u026af\u026a\u02c8ke\u026a\u0283n/', meaning = 't\u00e1i ph\u00e1t tri\u1ec3n \u0111\u00f4 th\u1ecb \u0111\u1ea9y gi\u00e1' WHERE id = 1712;
UPDATE vocabulary SET phonetic = '/k\u0259\u02c8mju\u02d0t/', meaning = '\u0111i l\u00e0m/\u0111i h\u1ecdc h\u1eb1ng ng\u00e0y' WHERE id = 1713;
UPDATE vocabulary SET phonetic = '/\u026an\u02c8d\u028astr\u026a\u0259l zo\u028an/', meaning = 'khu c\u00f4ng nghi\u1ec7p' WHERE id = 1715;
UPDATE vocabulary SET phonetic = '/\u02c8dre\u026an\u026ad\u0292 \u02c8s\u026ast\u0259m/', meaning = 'h\u1ec7 th\u1ed1ng tho\u00e1t n\u01b0\u1edbc' WHERE id = 1716;
UPDATE vocabulary SET phonetic = '/\u02c8tr\u00e6f\u026ak d\u0292\u00e6m/', meaning = '\u00f9n t\u1eafc giao th\u00f4ng' WHERE id = 1717;
UPDATE vocabulary SET phonetic = '/\u02c8s\u026av\u026ak \u0259\u02c8men\u0259tiz/', meaning = 'ti\u1ec7n \u00edch c\u00f4ng c\u1ed9ng' WHERE id = 1718;
UPDATE vocabulary SET phonetic = '/\u02c8\u025c\u02d0rb\u0259n \u02c8pl\u00e6n\u026a\u014b/', meaning = 'quy ho\u1ea1ch \u0111\u00f4 th\u1ecb' WHERE id = 1719;
UPDATE vocabulary SET phonetic = '/\u0259\u02c8f\u0254\u02d0rd\u0259bl \u02c8ha\u028az\u026a\u014b/', meaning = 'nh\u00e0 \u1edf gi\u00e1 ph\u1ea3i ch\u0103ng' WHERE id = 1720;

-- Unit 25
UPDATE vocabulary SET phonetic = '/k\u0259\u02c8r\u026a\u0259r/', meaning = 's\u1ef1 nghi\u1ec7p' WHERE id = 131;
UPDATE vocabulary SET phonetic = '/r\u026a\u02c8zju\u02d0m/', meaning = 'h\u1ed3 s\u01a1 xin vi\u1ec7c' WHERE id = 132;
UPDATE vocabulary SET phonetic = '/\u02c8w\u025c\u02d0rkple\u026as/', meaning = 'n\u01a1i l\u00e0m vi\u1ec7c' WHERE id = 136;
UPDATE vocabulary SET phonetic = '/pr\u0259\u02c8fe\u0283n/', meaning = 'ngh\u1ec1 nghi\u1ec7p chuy\u00ean m\u00f4n' WHERE id = 1722;
UPDATE vocabulary SET phonetic = '/\u02cc\u0252kju\u02c8pe\u026a\u0283n/', meaning = 'ngh\u1ec1 nghi\u1ec7p' WHERE id = 1723;
UPDATE vocabulary SET phonetic = '/d\u0292\u0252b \u02c8\u026ant\u0259rvju\u02d0/', meaning = 'ph\u1ecfng v\u1ea5n xin vi\u1ec7c' WHERE id = 1724;
UPDATE vocabulary SET phonetic = '/\u02c8\u026ant\u025c\u02d0rn\u0283\u026ap/', meaning = 'th\u1ef1c t\u1eadp' WHERE id = 1725;
UPDATE vocabulary SET phonetic = '/\u0259\u02c8prent\u026as/', meaning = 'h\u1ecdc vi\u1ec7c' WHERE id = 1726;
UPDATE vocabulary SET phonetic = '/\u02c8s\u00e6l\u0259ri/', meaning = 'l\u01b0\u01a1ng th\u00e1ng' WHERE id = 1728;
UPDATE vocabulary SET phonetic = '/we\u026ad\u0292/', meaning = 'ti\u1ec1n c\u00f4ng' WHERE id = 1729;
UPDATE vocabulary SET phonetic = '/pr\u0259\u02c8mo\u028a\u0283n/', meaning = 'th\u0103ng ch\u1ee9c' WHERE id = 1730;
UPDATE vocabulary SET phonetic = '/\u02c8dedla\u026an/', meaning = 'h\u1ea1n ch\u00f3t' WHERE id = 1731;
UPDATE vocabulary SET phonetic = '/\u02c8ti\u02d0mw\u025c\u02d0rk/', meaning = 'l\u00e0m vi\u1ec7c nh\u00f3m' WHERE id = 1732;
UPDATE vocabulary SET phonetic = '/\u02c8li\u02d0d\u0259r\u0283\u026ap/', meaning = 'kh\u1ea3 n\u0103ng l\u00e3nh \u0111\u1ea1o' WHERE id = 1733;
UPDATE vocabulary SET phonetic = '/\u02ccpr\u0252d\u028ak\u02c8t\u026av\u0259ti/', meaning = 'n\u0103ng su\u1ea5t' WHERE id = 1734;
UPDATE vocabulary SET phonetic = '/\u02ccs\u025c\u02d0rt\u026af\u026a\u02c8ke\u026a\u0283n/', meaning = 'ch\u1ee9ng ch\u1ec9' WHERE id = 1735;
UPDATE vocabulary SET phonetic = '/r\u026a\u02c8mo\u028at w\u025c\u02d0rk/', meaning = 'l\u00e0m vi\u1ec7c t\u1eeb xa' WHERE id = 1736;
UPDATE vocabulary SET phonetic = '/r\u026a\u02c8kru\u02d0tm\u0259nt/', meaning = 'tuy\u1ec3n d\u1ee5ng' WHERE id = 1738;
UPDATE vocabulary SET phonetic = '/pro\u028a\u02c8be\u026a\u0283n/', meaning = 'th\u1eed vi\u1ec7c' WHERE id = 1739;
UPDATE vocabulary SET phonetic = '/\u02c8k\u0252ntr\u00e6kt/', meaning = 'h\u1ee3p \u0111\u1ed3ng' WHERE id = 1740;
UPDATE vocabulary SET phonetic = '/n\u026a\u02cc\u0261o\u028a\u0283i\u02c8e\u026a\u0283n/', meaning = '\u0111\u00e0m ph\u00e1n' WHERE id = 1741;
UPDATE vocabulary SET phonetic = '/\u02c8k\u028ast\u0259m\u0259r \u02c8s\u025c\u02d0rv\u026as/', meaning = 'ch\u0103m s\u00f3c kh\u00e1ch h\u00e0ng' WHERE id = 1742;
UPDATE vocabulary SET phonetic = '/k\u0259\u02c8r\u026a\u0259r \u0259d\u02c8v\u00e6nsm\u0259nt/', meaning = 'th\u0103ng ti\u1ebfn ngh\u1ec1 nghi\u1ec7p' WHERE id = 1743;

-- Unit 26
UPDATE vocabulary SET phonetic = '/\u02cc\u0254\u02d0t\u0259\u02c8me\u026a\u0283n/', meaning = 't\u1ef1 \u0111\u1ed9ng h\u00f3a' WHERE id = 172;
UPDATE vocabulary SET phonetic = '/\u02cc\u026an\u0259\u02c8ve\u026a\u0283n/', meaning = '\u0111\u1ed5i m\u1edbi, s\u00e1ng t\u1ea1o' WHERE id = 175;
UPDATE vocabulary SET phonetic = '/\u02c8n\u028ar\u0259l \u02c8netw\u025c\u02d0rk/', meaning = 'm\u1ea1ng n\u01a1-ron' WHERE id = 1744;
UPDATE vocabulary SET phonetic = '/\u02c8de\u026at\u0259set/', meaning = 't\u1eadp d\u1eef li\u1ec7u' WHERE id = 1745;
UPDATE vocabulary SET phonetic = '/\u02c8t\u0283\u00e6tb\u0252t/', meaning = 'tr\u1ee3 l\u00fd tr\u00f2 chuy\u1ec7n' WHERE id = 1746;
UPDATE vocabulary SET phonetic = '/k\u0259m\u02c8pju\u02d0t\u0259r \u02c8v\u026a\u0292n/', meaning = 'th\u1ecb gi\u00e1c m\u00e1y t\u00ednh' WHERE id = 1747;
UPDATE vocabulary SET phonetic = '/\u02c8n\u00e6t\u0283r\u0259l \u02c8l\u00e6\u014b\u0261w\u026ad\u0292 \u02c8pr\u0252ses\u026a\u014b/', meaning = 'x\u1eed l\u00fd ng\u00f4n ng\u1eef t\u1ef1 nhi\u00ean' WHERE id = 1748;
UPDATE vocabulary SET phonetic = '/ro\u028a\u02c8b\u0252t\u026aks/', meaning = 'robot h\u1ecdc' WHERE id = 1749;
UPDATE vocabulary SET phonetic = '/\u02c8e\u03b8\u026akl \u02cce\u026a \u02c8a\u026a/', meaning = 'AI c\u00f3 \u0111\u1ea1o \u0111\u1ee9c' WHERE id = 1752;
UPDATE vocabulary SET phonetic = '/\u02c8ba\u026a\u0259s/', meaning = 'thi\u00ean l\u1ec7ch' WHERE id = 1753;
UPDATE vocabulary SET phonetic = '/tr\u00e6ns\u02c8p\u00e6r\u0259nsi/', meaning = 't\u00ednh minh b\u1ea1ch' WHERE id = 1754;
UPDATE vocabulary SET phonetic = '/\u02c8hju\u02d0m\u0259n \u02ccsu\u02d0p\u0259r\u02c8v\u026a\u0292n/', meaning = 'gi\u00e1m s\u00e1t c\u1ee7a con ng\u01b0\u1eddi' WHERE id = 1755;
UPDATE vocabulary SET phonetic = '/\u02c8m\u0252dl \u02c8tre\u026an\u026a\u014b/', meaning = 'hu\u1ea5n luy\u1ec7n m\u00f4 h\u00ecnh' WHERE id = 1756;
UPDATE vocabulary SET phonetic = '/\u02c8\u026anf\u0259r\u0259ns/', meaning = 'suy lu\u1eadn m\u00f4 h\u00ecnh' WHERE id = 1757;
UPDATE vocabulary SET phonetic = '/\u02c8d\u0292en\u0259r\u0259t\u026av \u02cce\u026a \u02c8a\u026a/', meaning = 'AI t\u1ea1o sinh' WHERE id = 1758;
UPDATE vocabulary SET phonetic = '/\u02c8de\u026at\u0259 \u02c8pr\u026av\u0259si/', meaning = 'quy\u1ec1n ri\u00eang t\u01b0 d\u1eef li\u1ec7u' WHERE id = 1759;
UPDATE vocabulary SET phonetic = '/\u02ccrek\u0259men\u02c8de\u026a\u0283n \u02c8s\u026ast\u0259m/', meaning = 'h\u1ec7 g\u1ee3i \u00fd' WHERE id = 1760;
UPDATE vocabulary SET phonetic = '/spi\u02d0t\u0283 \u02ccrek\u0259\u0261\u02c8n\u026a\u0283n/', meaning = 'nh\u1eadn d\u1ea1ng gi\u1ecdng n\u00f3i' WHERE id = 1761;
UPDATE vocabulary SET phonetic = '/\u0254\u02d0\u02c8t\u0252n\u0259m\u0259s \u02c8vi\u02d0\u0259kl/', meaning = 'xe t\u1ef1 h\u00e0nh' WHERE id = 1762;
UPDATE vocabulary SET phonetic = '/\u02c8v\u025c\u02d0rt\u0283u\u0259l \u0259\u02c8s\u026ast\u0259nt/', meaning = 'tr\u1ee3 l\u00fd \u1ea3o' WHERE id = 1763;
UPDATE vocabulary SET phonetic = '/pr\u0252mpt \u02ccend\u0292\u026a\u02c8n\u026a\u0259r\u026a\u014b/', meaning = 'k\u1ef9 thu\u1eadt vi\u1ebft prompt' WHERE id = 1764;

-- Unit 27
UPDATE vocabulary SET phonetic = '/\u02c8hedla\u026an/', meaning = 'ti\u00eau \u0111\u1ec1' WHERE id = 179;
UPDATE vocabulary SET phonetic = '/r\u026a\u02c8la\u026a\u0259bl/', meaning = '\u0111\u00e1ng tin c\u1eady' WHERE id = 181;
UPDATE vocabulary SET phonetic = '/\u02cced\u026a\u02c8t\u0254\u02d0ri\u0259l/', meaning = 'b\u00e0i x\u00e3 lu\u1eadn' WHERE id = 1765;
UPDATE vocabulary SET phonetic = '/pres \u02c8k\u0252nf\u0259r\u0259ns/', meaning = 'h\u1ecdp b\u00e1o' WHERE id = 1766;
UPDATE vocabulary SET phonetic = '/\u02ccm\u026as\u026anf\u0259r\u02c8me\u026a\u0283n/', meaning = 'th\u00f4ng tin sai l\u1ec7ch' WHERE id = 1767;
UPDATE vocabulary SET phonetic = '/f\u00e6kt \u02c8t\u0283ek\u026a\u014b/', meaning = 'ki\u1ec3m ch\u1ee9ng th\u00f4ng tin' WHERE id = 1768;
UPDATE vocabulary SET phonetic = '/\u02c8\u0254\u02d0di\u0259ns/', meaning = 'kh\u00e1n gi\u1ea3' WHERE id = 1769;
UPDATE vocabulary SET phonetic = '/\u02ccs\u025c\u02d0rkj\u0259\u02c8le\u026a\u0283n/', meaning = 's\u1ed1 l\u01b0\u1ee3ng ph\u00e1t h\u00e0nh' WHERE id = 1770;
UPDATE vocabulary SET phonetic = '/\u02c8re\u026at\u026a\u014bz/', meaning = 't\u1ef7 su\u1ea5t ng\u01b0\u1eddi xem' WHERE id = 1771;
UPDATE vocabulary SET phonetic = '/\u02c8la\u026avstri\u02d0m/', meaning = 'ph\u00e1t tr\u1ef1c ti\u1ebfp' WHERE id = 1773;
UPDATE vocabulary SET phonetic = '/\u02ccd\u0252kj\u0259\u02c8mentri/', meaning = 'phim t\u00e0i li\u1ec7u' WHERE id = 1774;
UPDATE vocabulary SET phonetic = '/nju\u02d0z \u02c8\u00e6\u014bk\u0259r/', meaning = 'ng\u01b0\u1eddi d\u1eabn b\u1ea3n tin' WHERE id = 1775;
UPDATE vocabulary SET phonetic = '/\u02cck\u0252r\u026a\u02c8sp\u0252nd\u0259nt/', meaning = 'ph\u00f3ng vi\u00ean th\u01b0\u1eddng tr\u00fa' WHERE id = 1776;
UPDATE vocabulary SET phonetic = '/\u02c8so\u028a\u0283l \u02c8pl\u00e6tf\u0254\u02d0rm/', meaning = 'n\u1ec1n t\u1ea3ng m\u1ea1ng x\u00e3 h\u1ed9i' WHERE id = 1777;
UPDATE vocabulary SET phonetic = '/\u02c8va\u026ar\u0259l \u02c8k\u0252ntent/', meaning = 'n\u1ed9i dung lan truy\u1ec1n' WHERE id = 1778;
UPDATE vocabulary SET phonetic = '/\u02c8sens\u0259r\u0283\u026ap/', meaning = 'ki\u1ec3m duy\u1ec7t' WHERE id = 1779;
UPDATE vocabulary SET phonetic = '/\u02c8mi\u02d0di\u0259 \u02c8l\u026at\u0259r\u0259si/', meaning = 'n\u0103ng l\u1ef1c truy\u1ec1n th\u00f4ng' WHERE id = 1780;
UPDATE vocabulary SET phonetic = '/\u0259d\u02c8v\u025c\u02d0rt\u026asm\u0259nt/', meaning = 'qu\u1ea3ng c\u00e1o' WHERE id = 1781;
UPDATE vocabulary SET phonetic = '/s\u0259b\u02c8skra\u026ab\u0259r/', meaning = 'ng\u01b0\u1eddi \u0111\u0103ng k\u00fd' WHERE id = 1782;
UPDATE vocabulary SET phonetic = '/\u02c8\u026anflu\u0259ns\u0259r/', meaning = 'ng\u01b0\u1eddi \u1ea3nh h\u01b0\u1edfng' WHERE id = 1783;
UPDATE vocabulary SET phonetic = '/\u02c8p\u028abl\u026ak \u0259\u02c8p\u026anj\u0259n/', meaning = 'd\u01b0 lu\u1eadn x\u00e3 h\u1ed9i' WHERE id = 1784;
UPDATE vocabulary SET phonetic = '/s\u0254\u02d0rs \u02cckred\u0259\u02c8b\u026al\u0259ti/', meaning = '\u0111\u1ed9 tin c\u1eady c\u1ee7a ngu\u1ed3n' WHERE id = 1785;

-- Unit 28
UPDATE vocabulary SET phonetic = '/\u02cck\u0252ns\u0259r\u02c8ve\u026a\u0283n/', meaning = 'b\u1ea3o t\u1ed3n' WHERE id = 182;
UPDATE vocabulary SET phonetic = '/\u026ak\u02c8st\u026a\u014bkt/', meaning = 'tuy\u1ec7t ch\u1ee7ng' WHERE id = 183;
UPDATE vocabulary SET phonetic = '/\u02c8po\u028at\u0283\u026a\u014b/', meaning = 's\u0103n tr\u1ed9m' WHERE id = 184;
UPDATE vocabulary SET phonetic = '/\u02c8s\u00e6\u014bkt\u0283u\u0259ri/', meaning = 'khu b\u1ea3o t\u1ed3n' WHERE id = 185;
UPDATE vocabulary SET phonetic = '/\u02c8wa\u026aldla\u026af/', meaning = '\u0111\u1ed9ng v\u1eadt hoang d\u00e3' WHERE id = 187;
UPDATE vocabulary SET phonetic = '/\u02c8h\u00e6b\u026at\u00e6t/', meaning = 'm\u00f4i tr\u01b0\u1eddng s\u1ed1ng' WHERE id = 1786;
UPDATE vocabulary SET phonetic = '/\u02ccba\u026ao\u028uda\u026a\u02c8v\u025c\u02d0rs\u0259ti/', meaning = '\u0111a d\u1ea1ng sinh h\u1ecdc' WHERE id = 1787;
UPDATE vocabulary SET phonetic = '/\u026an\u02c8de\u026and\u0292\u0259rd \u02c8spi\u02d0\u0283i\u02d0z/', meaning = 'lo\u00e0i nguy c\u1ea5p' WHERE id = 1788;
UPDATE vocabulary SET phonetic = '/\u02c8i\u02d0ko\u028a\u02ccS\u026ast\u0259m/', meaning = 'h\u1ec7 sinh th\u00e1i' WHERE id = 1789;
UPDATE vocabulary SET phonetic = '/\u02ccri\u02d0\u0259\u02ccb\u026al\u026a\u02c8te\u026a\u0283n/', meaning = 'ph\u1ee5c h\u1ed3i' WHERE id = 1790;
UPDATE vocabulary SET phonetic = '/\u026ak\u02c8st\u026a\u014bk\u0283n/', meaning = 's\u1ef1 tuy\u1ec7t ch\u1ee7ng' WHERE id = 1791;
UPDATE vocabulary SET phonetic = '/\u02c8wa\u026aldla\u026af \u02c8k\u0252r\u026ad\u0254\u02d0r/', meaning = 'h\u00e0nh lang sinh th\u00e1i' WHERE id = 1792;
UPDATE vocabulary SET phonetic = '/\u02cck\u0252ns\u0259r\u02c8ve\u026a\u0283\u0259n\u026ast/', meaning = 'nh\u00e0 b\u1ea3o t\u1ed3n' WHERE id = 1793;
UPDATE vocabulary SET phonetic = '/\u02c8\u00e6nti \u02c8po\u028at\u0283\u026a\u014b p\u0259\u02c8tro\u028al/', meaning = '\u0111\u1ed9i tu\u1ea7n tra ch\u1ed1ng s\u0103n tr\u1ed9m' WHERE id = 1795;
UPDATE vocabulary SET phonetic = '/m\u0259\u02c8ri\u02d0n r\u026a\u02c8z\u025c\u02d0rv/', meaning = 'khu b\u1ea3o t\u1ed3n bi\u1ec3n' WHERE id = 1797;
UPDATE vocabulary SET phonetic = '/\u02ccdi\u02d0\u02ccf\u0252r\u026a\u02c8ste\u026a\u0283n/', meaning = 'ph\u00e1 r\u1eebng' WHERE id = 1798;
UPDATE vocabulary SET phonetic = '/\u026a\u02c8li\u02d0\u0261l \u02c8wa\u026aldla\u026af tre\u026ad/', meaning = 'bu\u00f4n b\u00e1n \u0111\u1ed9ng v\u1eadt hoang d\u00e3 tr\u00e1i ph\u00e9p' WHERE id = 1799;
UPDATE vocabulary SET phonetic = '/pr\u0259\u02c8tekt\u026ad \u02c8e\u0259ri\u0259/', meaning = 'khu v\u1ef1c \u0111\u01b0\u1ee3c b\u1ea3o v\u1ec7' WHERE id = 1800;
UPDATE vocabulary SET phonetic = '/ma\u026a\u02c8\u0261re\u026a\u0283n ru\u02d0t/', meaning = '\u0111\u01b0\u1eddng di c\u01b0' WHERE id = 1801;
UPDATE vocabulary SET phonetic = '/ri\u02d0\u02c8wa\u026ald\u026a\u014b/', meaning = 't\u00e1i hoang d\u00e3 h\u00f3a' WHERE id = 1803;
UPDATE vocabulary SET phonetic = '/\u02c8kla\u026am\u0259t r\u026a\u02c8z\u026ali\u0259ns/', meaning = 'kh\u1ea3 n\u0103ng ch\u1ed1ng ch\u1ecbu kh\u00ed h\u1eadu' WHERE id = 1804;
UPDATE vocabulary SET phonetic = '/\u02c8spi\u02d0\u0283i\u02d0z \u02c8m\u0252n\u026at\u0259r\u026a\u014b/', meaning = 'theo d\u00f5i lo\u00e0i' WHERE id = 1805;
UPDATE vocabulary SET phonetic = '/\u02c8hju\u02d0m\u0259n \u02c8wa\u026aldla\u026af \u02c8k\u0252nfl\u026akt/', meaning = 'xung \u0111\u1ed9t ng\u01b0\u1eddi v\u00e0 \u0111\u1ed9ng v\u1eadt hoang d\u00e3' WHERE id = 1807;

-- Unit 29
UPDATE vocabulary SET phonetic = '/k\u0259\u02c8r\u026a\u0259r p\u00e6\u03b8/', meaning = 'con \u0111\u01b0\u1eddng s\u1ef1 nghi\u1ec7p' WHERE id = 188;
UPDATE vocabulary SET phonetic = '/\u02c8rezjume\u026a/', meaning = 's\u01a1 y\u1ebfu l\u00fd l\u1ecbch' WHERE id = 190;
UPDATE vocabulary SET phonetic = '/\u02c8\u00e6pt\u026atju\u02d0d/', meaning = 'n\u0103ng khi\u1ebfu' WHERE id = 1808;
UPDATE vocabulary SET phonetic = '/vo\u028a\u02c8ke\u026a\u0283n/', meaning = 'ngh\u1ec1 nghi\u1ec7p ph\u00f9 h\u1ee3p' WHERE id = 1809;
UPDATE vocabulary SET phonetic = '/\u02c8p\u00e6\u0283n/', meaning = '\u0111am m\u00ea' WHERE id = 1810;
UPDATE vocabulary SET phonetic = '/stre\u014b\u03b8s/', meaning = '\u0111i\u1ec3m m\u1ea1nh' WHERE id = 1811;
UPDATE vocabulary SET phonetic = '/p\u0254\u02d0rt\u02c8fo\u028ali\u028a/', meaning = 'h\u1ed3 s\u01a1 n\u0103ng l\u1ef1c' WHERE id = 1813;
UPDATE vocabulary SET phonetic = '/\u02c8sk\u0252l\u0259r\u0283\u026ap/', meaning = 'h\u1ecdc b\u1ed5ng' WHERE id = 1814;
UPDATE vocabulary SET phonetic = '/\u02c8entr\u0259ns \u026a\u0261\u02c8z\u00e6m/', meaning = 'k\u1ef3 thi \u0111\u1ea7u v\u00e0o' WHERE id = 1815;
UPDATE vocabulary SET phonetic = '/\u02c8me\u026ad\u0292\u0259r/', meaning = 'chuy\u00ean ng\u00e0nh' WHERE id = 1816;
UPDATE vocabulary SET phonetic = '/vo\u028a\u02c8ke\u026a\u0283\u0259nl \u02c8tre\u026an\u026a\u014b/', meaning = '\u0111\u00e0o t\u1ea1o ngh\u1ec1' WHERE id = 1817;
UPDATE vocabulary SET phonetic = '/\u02c8ment\u0254\u02d0r\u0283\u026ap/', meaning = 's\u1ef1 c\u1ed1 v\u1ea5n' WHERE id = 1818;
UPDATE vocabulary SET phonetic = '/tr\u00e6ns\u02c8f\u025c\u02d0r\u0259bl sk\u026alz/', meaning = 'k\u1ef9 n\u0103ng chuy\u1ec3n \u0111\u1ed5i' WHERE id = 1820;
UPDATE vocabulary SET phonetic = '/l\u0252\u014b t\u025c\u02d0rm \u0261o\u028al/', meaning = 'm\u1ee5c ti\u00eau d\u00e0i h\u1ea1n' WHERE id = 1821;
UPDATE vocabulary SET phonetic = '/d\u026a\u02c8s\u026a\u0292n \u02c8me\u026ak\u026a\u014b/', meaning = 'ra quy\u1ebft \u0111\u1ecbnh' WHERE id = 1822;
UPDATE vocabulary SET phonetic = '/self \u0259\u02c8sesm\u0259nt/', meaning = 't\u1ef1 \u0111\u00e1nh gi\u00e1' WHERE id = 1823;
UPDATE vocabulary SET phonetic = '/\u02c8m\u0251\u02d0rk\u026at d\u026a\u02c8m\u00e6nd/', meaning = 'nhu c\u1ea7u th\u1ecb tr\u01b0\u1eddng' WHERE id = 1824;
UPDATE vocabulary SET phonetic = '/\u02cc\u0252ntr\u0259pr\u0259\u02c8n\u025c\u02d0r\u0283\u026ap/', meaning = 'tinh th\u1ea7n kh\u1edfi nghi\u1ec7p' WHERE id = 1825;
UPDATE vocabulary SET phonetic = '/\u02c8st\u0251\u02d0rt\u028ap/', meaning = 'c\u00f4ng ty kh\u1edfi nghi\u1ec7p' WHERE id = 1826;
UPDATE vocabulary SET phonetic = '/pr\u0259\u02c8fe\u0283\u0259nl d\u026a\u02c8vel\u0259pm\u0259nt/', meaning = 'ph\u00e1t tri\u1ec3n chuy\u00ean m\u00f4n' WHERE id = 1827;
UPDATE vocabulary SET phonetic = '/\u02ccs\u025c\u02d0rt\u026af\u026a\u02c8ke\u026a\u0283n \u026a\u0261\u02c8z\u00e6m/', meaning = 'k\u1ef3 thi ch\u1ee9ng ch\u1ec9' WHERE id = 1828;
UPDATE vocabulary SET phonetic = '/\u02c8p\u00e6\u03b8we\u026a/', meaning = 'l\u1ed9 tr\u00ecnh' WHERE id = 1829;
UPDATE vocabulary SET phonetic = '/\u026am\u02ccpl\u0254\u026a\u0259\u02c8b\u026al\u0259ti/', meaning = 'kh\u1ea3 n\u0103ng t\u00ecm vi\u1ec7c' WHERE id = 1830;

-- Unit 30
UPDATE vocabulary SET phonetic = '/\u02ccla\u026afl\u0252\u014b \u02c8l\u025c\u02d0rn\u026a\u014b/', meaning = 'h\u1ecdc t\u1eadp su\u1ed1t \u0111\u1eddi' WHERE id = 194;
UPDATE vocabulary SET phonetic = '/s\u0259r\u02c8t\u026af\u026ak\u0259t/', meaning = 'ch\u1ee9ng ch\u1ec9' WHERE id = 197;
UPDATE vocabulary SET phonetic = '/self d\u026a\u02c8rekt\u026ad \u02c8l\u025c\u02d0rn\u026a\u014b/', meaning = 't\u1ef1 h\u1ecdc c\u00f3 \u0111\u1ecbnh h\u01b0\u1edbng' WHERE id = 1831;
UPDATE vocabulary SET phonetic = '/ri\u02d0\u02c8sk\u026al/', meaning = '\u0111\u00e0o t\u1ea1o l\u1ea1i k\u1ef9 n\u0103ng' WHERE id = 1833;
UPDATE vocabulary SET phonetic = '/\u02cckj\u028ar\u026a\u02c8\u0252s\u0259ti/', meaning = 't\u00f2 m\u00f2 h\u1ecdc h\u1ecfi' WHERE id = 1834;
UPDATE vocabulary SET phonetic = '/\u02c8kr\u026at\u026akl \u02c8\u03b8\u026a\u014bk\u026a\u014b/', meaning = 't\u01b0 duy ph\u1ea3n bi\u1ec7n' WHERE id = 1835;
UPDATE vocabulary SET phonetic = '/\u02c8ma\u026akro\u028a\u02ccl\u025c\u02d0rn\u026a\u014b/', meaning = 'h\u1ecdc vi m\u00f4' WHERE id = 1836;
UPDATE vocabulary SET phonetic = '/r\u026a\u02c8flekt\u026av \u02c8pr\u00e6kt\u026as/', meaning = 'th\u1ef1c h\u00e0nh ph\u1ea3n t\u01b0' WHERE id = 1837;
UPDATE vocabulary SET phonetic = '/\u02c8n\u0252l\u026ad\u0292 r\u026a\u02c8ten\u0283n/', meaning = 'kh\u1ea3 n\u0103ng ghi nh\u1edb ki\u1ebfn th\u1ee9c' WHERE id = 1838;
UPDATE vocabulary SET phonetic = '/k\u0259n\u02c8t\u026anju\u0259s \u026am\u02c8pru\u02d0vm\u0259nt/', meaning = 'c\u1ea3i ti\u1ebfn li\u00ean t\u1ee5c' WHERE id = 1839;
UPDATE vocabulary SET phonetic = '/\u02c8l\u025c\u02d0rn\u026a\u014b k\u0259\u02c8mju\u02d0n\u0259ti/', meaning = 'c\u1ed9ng \u0111\u1ed3ng h\u1ecdc t\u1eadp' WHERE id = 1840;
UPDATE vocabulary SET phonetic = '/\u02c8w\u025c\u02d0rk\u0283\u0252p/', meaning = 'h\u1ed9i th\u1ea3o th\u1ef1c h\u00e0nh' WHERE id = 1841;
UPDATE vocabulary SET phonetic = '/\u02c8sem\u026an\u0251\u02d0r/', meaning = 'h\u1ed9i th\u1ea3o chuy\u00ean \u0111\u1ec1' WHERE id = 1842;
UPDATE vocabulary SET phonetic = '/\u02cco\u028ap\u0259n \u02c8ma\u026and\u026adn\u0259s/', meaning = 't\u01b0 duy c\u1edfi m\u1edf' WHERE id = 1843;
UPDATE vocabulary SET phonetic = '/\u02c8d\u026as\u0259pl\u026an/', meaning = 't\u00ednh k\u1ef7 lu\u1eadt' WHERE id = 1844;
UPDATE vocabulary SET phonetic = '/ta\u026am \u02c8m\u00e6n\u026ad\u0292m\u0259nt/', meaning = 'qu\u1ea3n l\u00fd th\u1eddi gian' WHERE id = 1845;
UPDATE vocabulary SET phonetic = '/p\u026a\u0259r \u02c8l\u025c\u02d0rn\u026a\u014b/', meaning = 'h\u1ecdc t\u1eadp \u0111\u1ed3ng \u0111\u1eb3ng' WHERE id = 1846;
UPDATE vocabulary SET phonetic = '/\u02c8d\u026ad\u0292\u026atl \u02c8l\u026at\u0259r\u0259si/', meaning = 'n\u0103ng l\u1ef1c s\u1ed1' WHERE id = 1847;
UPDATE vocabulary SET phonetic = '/\u02c8pr\u0252bl\u0259m \u02c8s\u0252lv\u026a\u014b/', meaning = 'gi\u1ea3i quy\u1ebft v\u1ea5n \u0111\u1ec1' WHERE id = 1848;
UPDATE vocabulary SET phonetic = '/\u0259\u02ccd\u00e6pt\u0259\u02c8b\u026al\u0259ti/', meaning = 'kh\u1ea3 n\u0103ng th\u00edch nghi' WHERE id = 1849;
UPDATE vocabulary SET phonetic = '/\u0261ro\u028a\u03b8 \u02c8ma\u026andset/', meaning = 't\u01b0 duy ph\u00e1t tri\u1ec3n' WHERE id = 1850;
UPDATE vocabulary SET phonetic = '/\u02cc\u026and\u026a\u02c8pend\u0259nt \u02c8st\u028adi/', meaning = 't\u1ef1 h\u1ecdc \u0111\u1ed9c l\u1eadp' WHERE id = 1851;
UPDATE vocabulary SET phonetic = '/\u02c8l\u025c\u02d0rn\u026a\u014b \u02c8h\u00e6b\u026at/', meaning = 'th\u00f3i quen h\u1ecdc t\u1eadp' WHERE id = 1853;
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, sql, 'utf8');
console.log('Written: ' + outPath);
console.log('Size: ' + fs.statSync(outPath).size + ' bytes');
