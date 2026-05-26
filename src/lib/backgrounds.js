// Architectural sketch backgrounds — SVG line drawings, free-to-use original artwork
// Each svg string uses currentColor so the parent can tint via color CSS property

export const BACKGROUNDS = [
  {
    id: 'fallingwater',
    n: 'Fallingwater',
    sub: 'F.L. Wright, 1939',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Rocky cliff base -->
      <path stroke-width="1.2" d="M0 380 L120 360 L140 340 L160 360 L180 340 L200 355 L200 500 L0 500Z" opacity=".4"/>
      <!-- Waterfall -->
      <path stroke-width=".8" stroke-dasharray="3,5" d="M140 360 Q138 390 145 420 Q142 450 148 480"/>
      <path stroke-width=".8" stroke-dasharray="3,5" d="M155 355 Q153 385 160 415 Q157 445 163 475"/>
      <path stroke-width=".8" stroke-dasharray="3,5" d="M168 348 Q166 378 173 408 Q170 438 176 468"/>
      <!-- Main lower terrace -->
      <rect stroke-width="1.4" x="190" y="290" width="300" height="55"/>
      <line stroke-width=".7" x1="220" y1="290" x2="220" y2="345"/>
      <line stroke-width=".7" x1="260" y1="290" x2="260" y2="345"/>
      <line stroke-width=".7" x1="340" y1="290" x2="340" y2="345"/>
      <line stroke-width=".7" x1="420" y1="290" x2="420" y2="345"/>
      <!-- Cantilevered terrace extension -->
      <rect stroke-width="1.4" x="490" y="260" width="120" height="30"/>
      <path stroke-width=".6" d="M490 260 L490 290 M540 260 L540 290 M580 260 L580 290"/>
      <!-- Second level -->
      <rect stroke-width="1.4" x="230" y="220" width="240" height="50"/>
      <line stroke-width=".7" x1="260" y1="220" x2="260" y2="270"/>
      <line stroke-width=".7" x1="320" y1="220" x2="320" y2="270"/>
      <line stroke-width=".7" x1="390" y1="220" x2="390" y2="270"/>
      <!-- Second terrace cantilever -->
      <rect stroke-width="1.2" x="470" y="190" width="100" height="30"/>
      <!-- Third level -->
      <rect stroke-width="1.4" x="270" y="150" width="180" height="50"/>
      <line stroke-width=".7" x1="300" y1="150" x2="300" y2="200"/>
      <line stroke-width=".7" x1="360" y1="150" x2="360" y2="200"/>
      <!-- Chimney mass -->
      <rect stroke-width="1.6" x="310" y="40" width="45" height="120"/>
      <rect stroke-width=".8" x="318" y="48" width="30" height="20" opacity=".5"/>
      <!-- Roof parapet -->
      <line stroke-width="1.2" x1="270" y1="150" x2="450" y2="150"/>
      <!-- Trees -->
      <circle stroke-width=".8" cx="60" cy="300" r="45" opacity=".3"/>
      <circle stroke-width=".8" cx="620" cy="260" r="55" opacity=".3"/>
      <circle stroke-width=".8" cx="680" cy="300" r="35" opacity=".25"/>
      <line stroke-width=".8" x1="60" y1="345" x2="60" y2="380" opacity=".4"/>
      <line stroke-width=".8" x1="620" y1="315" x2="620" y2="360" opacity=".4"/>
      <!-- Ground line -->
      <line stroke-width="1" x1="0" y1="380" x2="800" y2="380" opacity=".3"/>
      <!-- Hatching on cliff -->
      <g opacity=".2" stroke-width=".5">
        <line x1="110" y1="370" x2="130" y2="390"/>
        <line x1="125" y1="358" x2="145" y2="378"/>
        <line x1="140" y1="350" x2="160" y2="370"/>
        <line x1="155" y1="355" x2="175" y2="375"/>
        <line x1="170" y1="345" x2="190" y2="365"/>
        <line x1="185" y1="348" x2="200" y2="363"/>
      </g>
    </svg>`
  },
  {
    id: 'villa-savoye',
    n: 'Villa Savoye',
    sub: 'Le Corbusier, 1931',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Ground -->
      <line stroke-width=".8" x1="50" y1="420" x2="750" y2="420" opacity=".3"/>
      <!-- Pilotis (columns) -->
      <g stroke-width="1.2">
        <line x1="180" y1="420" x2="180" y2="280"/>
        <line x1="250" y1="420" x2="250" y2="280"/>
        <line x1="320" y1="420" x2="320" y2="280"/>
        <line x1="390" y1="420" x2="390" y2="280"/>
        <line x1="460" y1="420" x2="460" y2="280"/>
        <line x1="530" y1="420" x2="530" y2="280"/>
        <line x1="600" y1="420" x2="600" y2="280"/>
      </g>
      <!-- Main box - ground floor floating -->
      <rect stroke-width="1.6" x="160" y="210" width="470" height="80"/>
      <!-- Ribbon window band -->
      <rect stroke-width=".8" x="170" y="222" width="450" height="30" opacity=".6"/>
      <g stroke-width=".5" opacity=".5">
        <line x1="220" y1="222" x2="220" y2="252"/>
        <line x1="270" y1="222" x2="270" y2="252"/>
        <line x1="320" y1="222" x2="320" y2="252"/>
        <line x1="370" y1="222" x2="370" y2="252"/>
        <line x1="420" y1="222" x2="420" y2="252"/>
        <line x1="470" y1="222" x2="470" y2="252"/>
        <line x1="520" y1="222" x2="520" y2="252"/>
        <line x1="560" y1="222" x2="560" y2="252"/>
      </g>
      <!-- Second floor main box -->
      <rect stroke-width="1.6" x="160" y="130" width="470" height="80"/>
      <!-- Ramp visible through curved wall -->
      <path stroke-width="1" d="M280 130 Q310 160 340 210" opacity=".6"/>
      <!-- Roof terrace parapet -->
      <rect stroke-width="1.4" x="200" y="80" width="380" height="50"/>
      <!-- Curved staircase tower on roof -->
      <path stroke-width="1.2" d="M340 80 Q340 55 370 50 Q400 45 420 55 Q440 65 440 80"/>
      <!-- Ramp on roof -->
      <rect stroke-width="1" x="460" y="50" width="60" height="30" opacity=".7"/>
      <!-- Trees - round canopy -->
      <circle stroke-width=".8" cx="100" cy="360" r="50" opacity=".25"/>
      <circle stroke-width=".8" cx="720" cy="350" r="45" opacity=".25"/>
      <line stroke-width=".8" x1="100" y1="410" x2="100" y2="420" opacity=".3"/>
      <line stroke-width=".8" x1="720" y1="395" x2="720" y2="420" opacity=".3"/>
      <!-- Shadow under box -->
      <path stroke-width=".5" stroke-dasharray="2,4" d="M160 290 L160 280 M230 290 L230 280 M300 290 L300 280 M370 290 L370 280 M440 290 L440 280 M510 290 L510 280 M580 290 L580 280 M630 290 L630 280" opacity=".3"/>
    </svg>`
  },
  {
    id: 'farnsworth',
    n: 'Farnsworth House',
    sub: 'Mies van der Rohe, 1951',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Ground -->
      <line stroke-width=".8" x1="0" y1="420" x2="800" y2="420" opacity=".3"/>
      <!-- Grass lines -->
      <g stroke-width=".5" opacity=".2">
        <path d="M100 420 Q105 415 110 420"/>
        <path d="M200 420 Q205 415 210 420"/>
        <path d="M300 420 Q305 415 310 420"/>
        <path d="M400 420 Q405 415 410 420"/>
        <path d="M500 420 Q505 415 510 420"/>
        <path d="M600 420 Q605 415 610 420"/>
        <path d="M150 422 Q155 417 160 422"/>
        <path d="M350 422 Q355 417 360 422"/>
        <path d="M550 422 Q555 417 560 422"/>
      </g>
      <!-- Steel columns -->
      <g stroke-width="2">
        <line x1="190" y1="420" x2="190" y2="200"/>
        <line x1="310" y1="420" x2="310" y2="200"/>
        <line x1="430" y1="420" x2="430" y2="200"/>
        <line x1="550" y1="420" x2="550" y2="200"/>
        <line x1="190" y1="310" x2="190" y2="200"/>
        <line x1="310" y1="310" x2="310" y2="200"/>
        <line x1="430" y1="310" x2="430" y2="200"/>
        <line x1="550" y1="310" x2="550" y2="200"/>
      </g>
      <!-- Floor plate -->
      <rect stroke-width="2" x="175" y="305" width="395" height="12"/>
      <!-- Roof plate -->
      <rect stroke-width="2" x="175" y="193" width="395" height="12"/>
      <!-- Glass walls -->
      <rect stroke-width=".8" x="175" y="205" width="395" height="100" opacity=".5"/>
      <!-- Mullions -->
      <g stroke-width=".6" opacity=".6">
        <line x1="230" y1="205" x2="230" y2="305"/>
        <line x1="270" y1="205" x2="270" y2="305"/>
        <line x1="310" y1="205" x2="310" y2="305"/>
        <line x1="350" y1="205" x2="350" y2="305"/>
        <line x1="390" y1="205" x2="390" y2="305"/>
        <line x1="430" y1="205" x2="430" y2="305"/>
        <line x1="470" y1="205" x2="470" y2="305"/>
        <line x1="510" y1="205" x2="510" y2="305"/>
        <line x1="540" y1="205" x2="540" y2="305"/>
      </g>
      <!-- Door -->
      <rect stroke-width="1" x="345" y="248" width="50" height="57" opacity=".8"/>
      <!-- Terrace -->
      <rect stroke-width="1.4" x="150" y="350" width="440" height="10"/>
      <!-- Terrace columns -->
      <g stroke-width="1.8">
        <line x1="175" y1="360" x2="175" y2="420"/>
        <line x1="265" y1="360" x2="265" y2="420"/>
        <line x1="355" y1="360" x2="355" y2="420"/>
        <line x1="445" y1="360" x2="445" y2="420"/>
        <line x1="565" y1="360" x2="565" y2="420"/>
      </g>
      <!-- Steps -->
      <path stroke-width="1.2" d="M310 360 L310 380 L280 380 L280 395 L260 395 L260 410 L240 410 L240 420"/>
      <!-- Trees in background -->
      <g opacity=".2" stroke-width=".8">
        <path d="M80 300 Q80 240 120 220 Q160 200 160 260 Q160 300 120 320 Q80 340 80 300Z"/>
        <path d="M640 280 Q640 220 680 200 Q720 180 720 240 Q720 280 680 300 Q640 320 640 280Z"/>
        <line x1="120" y1="320" x2="120" y2="420"/>
        <line x1="680" y1="300" x2="680" y2="420"/>
      </g>
    </svg>`
  },
  {
    id: 'opera-sydney',
    n: 'Opéra de Sydney',
    sub: 'Jørn Utzon, 1973',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Water/harbour -->
      <path stroke-width=".6" d="M0 430 Q200 420 400 425 Q600 430 800 420" opacity=".3"/>
      <path stroke-width=".5" d="M0 445 Q200 435 400 440 Q600 445 800 435" opacity=".2"/>
      <path stroke-width=".5" d="M0 460 Q200 450 400 455 Q600 460 800 450" opacity=".15"/>
      <!-- Platform/podium base -->
      <path stroke-width="1.4" d="M100 400 L700 400 L720 420 L80 420 Z"/>
      <!-- Steps -->
      <line stroke-width=".8" x1="90" y1="410" x2="710" y2="410"/>
      <!-- Main shells - large group -->
      <g stroke-width="1.4">
        <path d="M150 400 Q180 320 240 260 Q280 220 300 240 Q320 260 300 320 Q280 360 250 400"/>
        <path d="M220 400 Q240 340 280 290 Q310 250 330 265 Q350 280 340 330 Q320 370 290 400"/>
        <path d="M300 400 Q310 350 340 310 Q365 275 380 285 Q395 295 390 340 Q375 375 350 400"/>
      </g>
      <!-- Small shells -->
      <g stroke-width="1.2">
        <path d="M420 400 Q435 360 460 330 Q478 308 490 315 Q502 322 498 355 Q485 380 465 400"/>
        <path d="M468 400 Q478 368 498 345 Q512 328 522 333 Q532 338 528 365 Q518 385 500 400"/>
      </g>
      <!-- Shell ribs/surface lines -->
      <g stroke-width=".5" opacity=".5">
        <path d="M170 390 Q195 340 230 290 Q255 255 270 265"/>
        <path d="M190 395 Q212 348 245 300 Q268 268 282 276"/>
        <path d="M240 395 Q258 352 288 310 Q310 278 322 284"/>
        <path d="M440 393 Q452 362 470 338 Q482 320 491 324"/>
        <path d="M452 396 Q462 368 480 346 Q492 330 500 333"/>
      </g>
      <!-- Reflection in water -->
      <g opacity=".12" stroke-width=".8">
        <path d="M150 420 Q180 460 240 490 Q280 510 300 490 Q320 470 300 440 Q280 420 250 420"/>
        <path d="M420 420 Q435 450 460 470 Q478 485 490 475 Q502 465 498 440 Q485 425 465 420"/>
      </g>
    </svg>`
  },
  {
    id: 'guggenheim-bilbao',
    n: 'Guggenheim Bilbao',
    sub: 'Frank Gehry, 1997',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Ground/riverside -->
      <line stroke-width=".8" x1="0" y1="420" x2="800" y2="420" opacity=".3"/>
      <!-- Water reflection -->
      <path stroke-width=".5" d="M0 435 Q200 430 400 432 Q600 434 800 430" opacity=".2"/>
      <!-- Main sculptural forms — deconstructivist curves -->
      <!-- Central atrium tower -->
      <path stroke-width="1.6" d="M340 100 Q360 80 390 90 Q420 95 430 120 Q435 150 420 200 Q410 230 390 260 Q370 240 350 210 Q330 180 330 150 Q330 120 340 100Z"/>
      <!-- Left wing — curved mass -->
      <path stroke-width="1.4" d="M100 350 Q120 280 160 240 Q200 200 250 210 Q300 215 330 260 Q350 290 350 340 Q300 370 240 380 Q170 390 120 380 Q100 375 100 350Z"/>
      <!-- Right wing — flowing form -->
      <path stroke-width="1.4" d="M430 340 Q440 290 460 250 Q490 210 530 220 Q580 225 610 265 Q640 300 650 340 Q610 370 560 380 Q500 390 460 375 Q430 365 430 340Z"/>
      <!-- Upper curved roof -->
      <path stroke-width="1.2" d="M200 240 Q260 180 340 160 Q410 145 460 165 Q530 190 570 230" opacity=".8"/>
      <!-- Titanium panel lines — curved surface articulation -->
      <g stroke-width=".5" opacity=".4">
        <path d="M140 320 Q170 280 210 260 Q250 242 280 250"/>
        <path d="M160 355 Q195 310 235 288 Q275 268 305 274"/>
        <path d="M460 320 Q490 285 525 268 Q558 252 580 260"/>
        <path d="M450 355 Q485 315 518 297 Q552 280 575 288"/>
        <path d="M355 180 Q375 155 400 148 Q420 143 435 158"/>
        <path d="M348 210 Q370 182 398 174 Q422 168 440 182"/>
      </g>
      <!-- Bridge/walkway -->
      <path stroke-width="1" d="M0 380 L120 370 L120 390 L0 400Z" opacity=".5"/>
      <!-- Puppy sculpture hint -->
      <path stroke-width=".8" d="M680 390 Q700 370 720 375 Q740 380 730 400 Q715 415 695 410 Q678 405 680 390Z" opacity=".3"/>
    </svg>`
  },
  {
    id: 'plan-haussmann',
    n: 'Façade Haussmannienne',
    sub: 'Paris, XIXe siècle',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Ground -->
      <line stroke-width="1" x1="0" y1="450" x2="800" y2="450" opacity=".5"/>
      <!-- Building outline -->
      <rect stroke-width="1.8" x="60" y="80" width="680" height="370"/>
      <!-- Mansard roof -->
      <path stroke-width="1.4" d="M60 80 L100 30 L700 30 L740 80"/>
      <!-- Roof dormer windows -->
      <g stroke-width="1">
        <path d="M155 80 L155 45 L195 45 L195 80"/>
        <path d="M165 45 Q175 35 185 45"/>
        <path d="M295 80 L295 45 L335 45 L335 80"/>
        <path d="M305 45 Q315 35 325 45"/>
        <path d="M435 80 L435 45 L475 45 L475 80"/>
        <path d="M445 45 Q455 35 465 45"/>
        <path d="M575 80 L575 45 L615 45 L615 80"/>
        <path d="M585 45 Q595 35 605 45"/>
      </g>
      <!-- Floor divisions -->
      <line stroke-width=".8" x1="60" y1="175" x2="740" y2="175"/>
      <line stroke-width=".8" x1="60" y1="255" x2="740" y2="255"/>
      <line stroke-width=".8" x1="60" y1="335" x2="740" y2="335"/>
      <!-- Piano nobile windows (tall arched) -->
      <g stroke-width="1.1">
        <path d="M105 100 L105 165 L165 165 L165 100 Q135 85 105 100Z"/>
        <path d="M245 100 L245 165 L305 165 L305 100 Q275 85 245 100Z"/>
        <path d="M385 100 L385 165 L445 165 L445 100 Q415 85 385 100Z"/>
        <path d="M525 100 L525 165 L585 165 L585 100 Q555 85 525 100Z"/>
        <path d="M665 100 L665 165 L725 165 L725 100 Q695 85 665 100Z"/>
      </g>
      <!-- Balconies piano nobile -->
      <g stroke-width=".8">
        <path d="M100 165 L170 165 L170 175 L100 175Z"/>
        <path d="M240 165 L310 165 L310 175 L240 175Z"/>
        <path d="M380 165 L450 165 L450 175 L380 175Z"/>
        <path d="M520 165 L590 165 L590 175 L520 175Z"/>
        <path d="M660 165 L730 165 L730 175 L660 175Z"/>
      </g>
      <!-- Second floor windows -->
      <g stroke-width="1">
        <rect x="105" y="190" width="60" height="50"/>
        <rect x="245" y="190" width="60" height="50"/>
        <rect x="385" y="190" width="60" height="50"/>
        <rect x="525" y="190" width="60" height="50"/>
        <rect x="665" y="190" width="60" height="50"/>
      </g>
      <!-- Third floor windows -->
      <g stroke-width="1">
        <rect x="105" y="270" width="60" height="50"/>
        <rect x="245" y="270" width="60" height="50"/>
        <rect x="385" y="270" width="60" height="50"/>
        <rect x="525" y="270" width="60" height="50"/>
        <rect x="665" y="270" width="60" height="50"/>
      </g>
      <!-- Ground floor - arcade -->
      <g stroke-width="1.1">
        <path d="M85 350 L85 450 L175 450 L175 350 Q130 330 85 350Z"/>
        <path d="M205 350 L205 450 L295 450 L295 350 Q250 330 205 350Z"/>
        <path d="M325 350 L325 450 L415 450 L415 350 Q370 330 325 350Z"/>
        <path d="M445 350 L445 450 L535 450 L535 350 Q490 330 445 350Z"/>
        <path d="M565 350 L565 450 L655 450 L655 350 Q610 330 565 350Z"/>
        <path d="M680 350 L680 450 L740 450 L740 350 Q710 335 680 350Z"/>
      </g>
      <!-- Stone coursing lines -->
      <g stroke-width=".4" opacity=".3">
        <line x1="60" y1="120" x2="740" y2="120"/>
        <line x1="60" y1="140" x2="740" y2="140"/>
        <line x1="60" y1="215" x2="740" y2="215"/>
        <line x1="60" y1="235" x2="740" y2="235"/>
        <line x1="60" y1="295" x2="740" y2="295"/>
        <line x1="60" y1="315" x2="740" y2="315"/>
      </g>
      <!-- Cornice mouldings -->
      <line stroke-width="2" x1="55" y1="85" x2="745" y2="85"/>
      <line stroke-width="1.5" x1="55" y1="177" x2="745" y2="177"/>
      <line stroke-width="1.5" x1="55" y1="257" x2="745" y2="257"/>
      <line stroke-width="1.5" x1="55" y1="337" x2="745" y2="337"/>
    </svg>`
  },
  {
    id: 'structure-acier',
    n: 'Structure en Acier',
    sub: 'Charpente métallique',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Grid axes -->
      <g stroke-width=".4" stroke-dasharray="4,6" opacity=".25">
        <line x1="150" y1="0" x2="150" y2="500"/>
        <line x1="300" y1="0" x2="300" y2="500"/>
        <line x1="450" y1="0" x2="450" y2="500"/>
        <line x1="600" y1="0" x2="600" y2="500"/>
        <line x1="0" y1="120" x2="800" y2="120"/>
        <line x1="0" y1="240" x2="800" y2="240"/>
        <line x1="0" y1="360" x2="800" y2="360"/>
      </g>
      <!-- Main structural columns (I-beams) -->
      <g stroke-width="2">
        <line x1="150" y1="460" x2="150" y2="80"/>
        <line x1="300" y1="460" x2="300" y2="80"/>
        <line x1="450" y1="460" x2="450" y2="80"/>
        <line x1="600" y1="460" x2="600" y2="80"/>
      </g>
      <!-- I-beam flanges -->
      <g stroke-width="1.2">
        <line x1="138" y1="460" x2="162" y2="460"/>
        <line x1="138" y1="80" x2="162" y2="80"/>
        <line x1="288" y1="460" x2="312" y2="460"/>
        <line x1="288" y1="80" x2="312" y2="80"/>
        <line x1="438" y1="460" x2="462" y2="460"/>
        <line x1="438" y1="80" x2="462" y2="80"/>
        <line x1="588" y1="460" x2="612" y2="460"/>
        <line x1="588" y1="80" x2="612" y2="80"/>
        <line x1="138" y1="240" x2="162" y2="240"/>
        <line x1="288" y1="240" x2="312" y2="240"/>
        <line x1="438" y1="240" x2="462" y2="240"/>
        <line x1="588" y1="240" x2="612" y2="240"/>
      </g>
      <!-- Horizontal beams -->
      <g stroke-width="1.8">
        <line x1="100" y1="120" x2="650" y2="120"/>
        <line x1="100" y1="240" x2="650" y2="240"/>
        <line x1="100" y1="360" x2="650" y2="360"/>
      </g>
      <!-- Secondary beams -->
      <g stroke-width=".9">
        <line x1="150" y1="120" x2="150" y2="240"/>
        <line x1="200" y1="120" x2="200" y2="240"/>
        <line x1="250" y1="120" x2="250" y2="240"/>
        <line x1="150" y1="240" x2="150" y2="360"/>
        <line x1="200" y1="240" x2="200" y2="360"/>
        <line x1="250" y1="240" x2="250" y2="360"/>
        <line x1="350" y1="120" x2="350" y2="240"/>
        <line x1="400" y1="120" x2="400" y2="240"/>
        <line x1="350" y1="240" x2="350" y2="360"/>
        <line x1="400" y1="240" x2="400" y2="360"/>
        <line x1="500" y1="120" x2="500" y2="240"/>
        <line x1="550" y1="120" x2="550" y2="240"/>
        <line x1="500" y1="240" x2="500" y2="360"/>
        <line x1="550" y1="240" x2="550" y2="360"/>
      </g>
      <!-- Cross-bracing diagonals -->
      <g stroke-width=".8" opacity=".7">
        <line x1="150" y1="120" x2="300" y2="240"/>
        <line x1="300" y1="120" x2="150" y2="240"/>
        <line x1="300" y1="240" x2="450" y2="360"/>
        <line x1="450" y1="240" x2="300" y2="360"/>
        <line x1="450" y1="120" x2="600" y2="240"/>
        <line x1="600" y1="120" x2="450" y2="240"/>
        <line x1="150" y1="240" x2="300" y2="360"/>
        <line x1="300" y1="240" x2="150" y2="360"/>
      </g>
      <!-- Bolt circles at connections -->
      <g stroke-width=".6" opacity=".5">
        <circle cx="150" cy="120" r="6"/>
        <circle cx="300" cy="120" r="6"/>
        <circle cx="450" cy="120" r="6"/>
        <circle cx="600" cy="120" r="6"/>
        <circle cx="150" cy="240" r="6"/>
        <circle cx="300" cy="240" r="6"/>
        <circle cx="450" cy="240" r="6"/>
        <circle cx="600" cy="240" r="6"/>
        <circle cx="150" cy="360" r="6"/>
        <circle cx="300" cy="360" r="6"/>
        <circle cx="450" cy="360" r="6"/>
        <circle cx="600" cy="360" r="6"/>
      </g>
      <!-- Base plates -->
      <g stroke-width="1.4">
        <rect x="132" y="455" width="36" height="12"/>
        <rect x="282" y="455" width="36" height="12"/>
        <rect x="432" y="455" width="36" height="12"/>
        <rect x="582" y="455" width="36" height="12"/>
      </g>
    </svg>`
  },
  {
    id: 'plan-masse',
    n: 'Plan de masse',
    sub: 'Urbanisme architectural',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <!-- Streets -->
      <g stroke-width="8" opacity=".15">
        <line x1="0" y1="170" x2="800" y2="170"/>
        <line x1="0" y1="330" x2="800" y2="330"/>
        <line x1="200" y1="0" x2="200" y2="500"/>
        <line x1="600" y1="0" x2="600" y2="500"/>
      </g>
      <!-- Street centre lines -->
      <g stroke-width=".6" stroke-dasharray="8,6" opacity=".3">
        <line x1="0" y1="170" x2="800" y2="170"/>
        <line x1="0" y1="330" x2="800" y2="330"/>
        <line x1="200" y1="0" x2="200" y2="500"/>
        <line x1="600" y1="0" x2="600" y2="500"/>
      </g>
      <!-- Block 1 — irregular building complex top-left -->
      <g stroke-width="1.4">
        <rect x="40" y="30" width="120" height="80"/>
        <rect x="80" y="60" width="60" height="100"/>
        <rect x="40" y="110" width="90" height="40"/>
      </g>
      <!-- Block 2 — top center -->
      <g stroke-width="1.4">
        <rect x="230" y="25" width="140" height="110"/>
        <rect x="270" y="80" width="60" height="55"/>
      </g>
      <!-- Block 3 — top right -->
      <g stroke-width="1.4">
        <rect x="630" y="30" width="80" height="60"/>
        <rect x="660" y="60" width="90" height="80"/>
        <rect x="630" y="90" width="50" height="60"/>
      </g>
      <!-- Central courtyard building -->
      <g stroke-width="1.6">
        <rect x="240" y="200" width="310" height="100"/>
        <rect x="270" y="220" width="250" height="60" stroke-dasharray="3,3" opacity=".5"/>
      </g>
      <!-- Block 4 — bottom left -->
      <g stroke-width="1.4">
        <rect x="30" y="360" width="130" height="100"/>
        <rect x="50" y="380" width="90" height="80"/>
      </g>
      <!-- Block 5 — bottom center -->
      <g stroke-width="1.4">
        <polygon points="220,360 340,360 360,430 220,440"/>
        <rect x="340" y="365" width="100" height="80"/>
      </g>
      <!-- Block 6 — bottom right -->
      <g stroke-width="1.4">
        <rect x="625" y="355" width="140" height="120"/>
        <rect x="640" y="370" width="60" height="50"/>
        <rect x="690" y="380" width="60" height="70"/>
      </g>
      <!-- Trees/landscaping -->
      <g stroke-width=".8" opacity=".4">
        <circle cx="160" cy="200" r="18"/>
        <circle cx="190" cy="220" r="14"/>
        <circle cx="170" cy="240" r="16"/>
        <circle cx="490" cy="150" r="20"/>
        <circle cx="520" cy="165" r="15"/>
        <circle cx="480" cy="385" r="18"/>
        <circle cx="510" cy="370" r="14"/>
        <circle cx="560" cy="390" r="16"/>
      </g>
      <!-- North arrow -->
      <g stroke-width="1.2">
        <line x1="740" y1="60" x2="740" y2="20"/>
        <path d="M734 35 L740 20 L746 35"/>
        <circle cx="740" cy="60" r="4" opacity=".6"/>
      </g>
      <text x="735" y="75" font-size="10" stroke-width=".5" opacity=".6" font-family="monospace">N</text>
      <!-- Dimension lines -->
      <g stroke-width=".6" opacity=".4">
        <line x1="240" y1="475" x2="560" y2="475"/>
        <line x1="240" y1="470" x2="240" y2="480"/>
        <line x1="560" y1="470" x2="560" y2="480"/>
        <line x1="775" y1="200" x2="775" y2="300"/>
        <line x1="770" y1="200" x2="780" y2="200"/>
        <line x1="770" y1="300" x2="780" y2="300"/>
      </g>
    </svg>`
  },
]


/* ══ CUSTOM BACKGROUND FIX ══════════════════════════════════════
Ensure every background object includes:
{
  id,
  name,
  preview,
  url
}

And apply with:
style={{
  backgroundImage: `url(${selectedBackground.url})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
}}
================================================================ */
