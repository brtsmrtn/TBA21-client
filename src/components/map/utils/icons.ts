import { DivIcon, divIcon } from 'leaflet';
import { colourScale } from './colorScale';

export function jellyFish(zLevel: number = 0): DivIcon {
  const
    colour = colourScale(zLevel),
    svg = `
    <svg width="30px" height="38px" viewBox="0 0 74 91" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <g stroke="none" stroke-width="1" fill="${colour.colour}" fill-rule="evenodd">
          <path d="M37,3.54 C18.446178,3.54550392 3.40206736,18.5761903 3.38,37.13 C3.38,37.25 3.31,47.26 3.38,53.24 L4.2,52.54 C6.49,50.54 9.96,47.54 13.67,47.54 C17.12,47.54 18.87,49.27 20.41,50.81 C21.95,52.35 22.95,53.32 25.33,53.31 C27.71,53.3 28.84,52.19 30.25,50.79 C31.66,49.39 33.53,47.55 36.95,47.55 L37.19,47.55 C40.51,47.63 42.19,49.33 43.75,50.83 C45.31,52.33 46.28,53.34 48.65,53.34 C51.02,53.34 52.15,52.21 53.57,50.78 C54.99,49.35 56.85,47.48 60.26,47.48 L60.35,47.48 C64.17,47.48 67.71,50.48 70.06,52.48 L70.58,52.91 L70.58,37.13 C70.5579708,18.5917907 55.538202,3.56754894 37,3.54 Z M22.43,37.12 C20.8173285,37.12 19.51,35.8126715 19.51,34.2 C19.51,32.5873285 20.8173285,31.28 22.43,31.28 C24.0426715,31.28 25.35,32.5873285 25.35,34.2 C25.35,35.8126715 24.0426715,37.12 22.43,37.12 Z M51.58,37.27 C49.9673285,37.27 48.66,35.9626715 48.66,34.35 C48.66,32.7373285 49.9673285,31.43 51.58,31.43 C53.1926715,31.43 54.5,32.7373285 54.5,34.35 C54.5026581,35.1261633 54.19619,35.8714484 53.6482954,36.4212193 C53.1004008,36.9709902 52.3561679,37.2800046 51.58,37.28 L51.58,37.27 Z" />
          <path d="M37,0.95 C17.0196606,0.955497347 0.81758116,17.1396788 0.79,37.12 C0.79,37.24 0.71,48.93 0.79,54.63 C0.707757965,55.3917096 1.10610547,56.124669 1.79,56.47 C2.00321558,56.5683983 2.23517469,56.6195658 2.47,56.62 C3.47,56.62 4.41,55.77 5.87,54.51 C7.58,53 10,51 12.38,50.34 C12.38,51.7 12.38,53.64 12.38,54.61 C12.3537451,56.1597451 13.0713022,57.6283205 14.31,58.56 C15.01,59.2 15.39,59.56 15.39,60.49 C15.39,61.08 14.55,61.56 13.26,62.21 C11.66,63.03 9.67,64.04 9.66,66.33 C9.65,68.62 11.66,69.61 13.24,70.42 C14.53,71.08 15.38,71.56 15.38,72.16 C15.38,72.76 14.53,73.24 13.24,73.9 C11.64,74.71 9.66,75.72 9.66,77.99 C9.66,80.26 11.79,81.43 13.35,82.23 C14.35,82.72 15.35,83.28 15.35,83.8 C15.3561645,84.6740934 14.9340802,85.4958505 14.22,86 C13.080415,86.8886273 12.4040166,88.2451001 12.38,89.69 C12.4390414,90.3612316 13.0011767,90.8760921 13.675,90.8760921 C14.3488233,90.8760921 14.9109586,90.3612316 14.97,89.69 C14.97,88.9 15.29,88.57 15.97,87.88 C17.209845,86.9198425 17.945781,85.4479705 17.97,83.88 C17.97,81.78 16.06,80.8 14.53,80.01 C13.15,79.3 12.25,78.78 12.25,78.07 C12.25,77.36 13.11,76.96 14.42,76.29 C16,75.4 18,74.4 18,72.15 C18,69.9 16,68.91 14.44,68.15 C13.13,67.48 12.27,67 12.28,66.38 C12.29,65.76 13.15,65.24 14.46,64.57 C16.03,63.77 18,62.76 18,60.57 C18.002363,59.0609223 17.2949007,57.6385898 16.09,56.73 C15.38,56.08 14.99,55.73 15,54.73 C15.01,53.73 15,51.73 15,50.39 C16.4164071,50.7943734 17.6757764,51.6211615 18.61,52.76 C20.15,54.29 21.89,56.01 25.31,56.01 L25.37,56.01 C28.82,56.01 30.56,54.26 32.1,52.74 C33.0559047,51.562439 34.3684145,50.7272055 35.84,50.36 C35.84,51.72 35.84,53.72 35.84,54.74 C35.84,55.76 35.46,56.09 34.75,56.74 C33.541332,57.646501 32.83,59.0691649 32.83,60.58 C32.83,62.8 34.83,63.8 36.37,64.58 C37.69,65.25 38.55,65.74 38.55,66.39 C38.55,67.04 37.69,67.5 36.39,68.16 C34.81,68.97 32.83,69.97 32.83,72.16 C32.83,74.35 34.83,75.41 36.39,76.22 C37.7,76.89 38.56,77.37 38.56,78 C38.56,78.63 37.66,79.22 36.28,79.94 C34.75,80.73 32.84,81.72 32.84,83.81 C32.864219,85.3779705 33.600155,86.8498425 34.84,87.81 C35.56,88.5 35.84,88.81 35.84,89.62 C35.8990414,90.2912316 36.4611767,90.8060921 37.135,90.8060921 C37.8088233,90.8060921 38.3709586,90.2912316 38.43,89.62 C38.3803301,88.1964743 37.6983935,86.8692644 36.57,86 C35.8532129,85.5085626 35.4204588,84.6990139 35.41,83.83 C35.41,83.31 36.49,82.76 37.41,82.26 C38.97,81.46 41.1,80.36 41.1,78.02 C41.1,75.68 39.1,74.75 37.52,73.93 C36.22,73.27 35.38,72.79 35.38,72.19 C35.38,71.59 36.23,71.11 37.52,70.45 C39.12,69.64 41.11,68.63 41.1,66.36 C41.09,64.09 39.1,63.06 37.5,62.24 C36.22,61.58 35.37,61.11 35.37,60.52 C35.37,59.59 35.75,59.23 36.45,58.59 C37.6886978,57.6583205 38.4062549,56.1897451 38.38,54.64 C38.38,53.64 38.38,51.71 38.38,50.36 C39.7582724,50.7920667 40.981224,51.6154744 41.9,52.73 C43.47,54.23 45.22,56 48.66,56 C52.1,56 53.87,54.24 55.42,52.68 C56.62,51.47 57.62,50.48 59.35,50.22 C59.35,51.58 59.35,53.64 59.35,54.65 C59.3237451,56.1997451 60.0413022,57.6683205 61.28,58.6 C61.98,59.24 62.36,59.6 62.36,60.53 C62.36,61.12 61.52,61.6 60.23,62.25 C58.63,63.07 56.64,64.08 56.63,66.37 C56.62,68.66 58.63,69.65 60.21,70.46 C61.5,71.12 62.35,71.6 62.35,72.2 C62.35,72.8 61.5,73.28 60.21,73.94 C58.61,74.75 56.63,75.76 56.63,78.03 C56.63,80.3 58.76,81.47 60.32,82.27 C61.32,82.76 62.32,83.32 62.32,83.84 C62.3108799,84.7017908 61.8863382,85.5061854 61.18,86 C60.040415,86.8886273 59.3640166,88.2451001 59.34,89.69 C59.3990414,90.3612316 59.9611767,90.8760921 60.635,90.8760921 C61.3088233,90.8760921 61.8709586,90.3612316 61.93,89.69 C61.93,88.9 62.25,88.57 62.93,87.88 C64.169845,86.9198425 64.905781,85.4479705 64.93,83.88 C64.93,81.78 63.02,80.8 61.49,80.01 C60.11,79.3 59.21,78.78 59.21,78.07 C59.21,77.36 60.07,76.96 61.38,76.29 C62.97,75.48 64.94,74.48 64.94,72.23 C64.94,69.98 62.94,68.99 61.38,68.23 C60.07,67.56 59.21,67.08 59.22,66.46 C59.23,65.84 60.09,65.32 61.4,64.65 C62.98,63.85 64.94,62.84 64.94,60.65 C64.9869688,59.0795149 64.2623539,57.5854635 63,56.65 C62.29,56 61.9,55.65 61.91,54.65 C61.92,53.65 61.91,51.73 61.91,50.37 C64.3,51.07 66.68,53.08 68.36,54.49 C70.04,55.9 71.1,56.79 72.21,56.28 C72.8336745,55.9724622 73.2034243,55.3124787 73.14,54.62 L73.14,37.13 C73.1125226,17.175337 56.9546204,0.999551089 37,0.95 Z M70.59,52.95 L70.07,52.52 C67.73,50.52 64.19,47.52 60.36,47.52 L60.27,47.52 C56.86,47.52 55.12,49.27 53.58,50.82 C52.04,52.37 51,53.37 48.66,53.37 C46.32,53.37 45.17,52.26 43.76,50.86 C42.35,49.46 40.52,47.66 37.2,47.58 L37,47.58 C33.57,47.58 31.83,49.3 30.3,50.82 C28.77,52.34 27.76,53.33 25.38,53.34 C23,53.35 21.88,52.24 20.46,50.84 C19.04,49.44 17.17,47.57 13.72,47.57 C10.01,47.57 6.55,50.57 4.25,52.57 L3.43,53.27 C3.38,47.27 3.43,37.27 3.43,37.16 C3.43,18.6087553 18.4687553,3.57 37.02,3.57 C55.5712447,3.57 70.61,18.6087553 70.61,37.16 L70.59,52.95 Z" fill="${colour.outline}" fill-rule="nonzero" />
          <circle fill="#fff" cx="22.43" cy="34.2" r="2.92" />
          <circle fill="#fff" cx="51.58" cy="34.35" r="2.92" />
      </g>
    </svg>`;

  return divIcon({
     html: svg,
     iconSize:     [30, 38], // size of the icon
     iconAnchor:   [15, 38], // point of the icon which will correspond to marker's location [iconWidth/2, iconHeight]
   });
}
export function pin(zLevel: number = 0): DivIcon {
  const
    colour = colourScale(zLevel),
    svg = `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20" height="25" viewBox="0 0 485.212 485.212" xml:space="preserve">
        <path fill="${colour.colour}" stroke="${colour.outline}" stroke-width="30" d="M348.748,106.141C348.748,47.532,301.212,0,242.604,0c-58.609,0-106.139,47.532-106.139,106.141c0,53.424,39.61,97.196,90.976,104.598v274.473h30.327V210.739C309.119,203.337,348.748,159.565,348.748,106.141z"/>
      </svg>
`;

  return divIcon({
     html: svg,
     iconSize:     [20, 23], // size of the icon
     iconAnchor:   [10, 23], // point of the icon which will correspond to marker's location [iconWidth/2, iconHeight]
   });
}
export function OALogo(zLevel: number = 0): DivIcon {
  const
    colour = colourScale(zLevel),
    svgStyle = `fill-rule: evenodd; fill: ${colour.colour}; stroke: ${colour.outline}; stroke-width: 10px`,
    svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 295 285">
          <g>
            <path style="${svgStyle}" d="M174.39,185.08h35.87v35H174.39l-57.54-30.65L93.43,220.09H49l57.53-75.19Zm35.87,0V150h35.86v35.05Z"/>
            <path style="${svgStyle}" d="M238.1,71.47H202.77c.45,5.57-.17,18.39-7.41,23.14-5.49,3.61-16.86,2-39-10.18-3-1.68-6-3.18-8.93-4.59-29-14.69-53.38-20.08-70.43-8.77-22.23,14.74-21.63,47.54-20.76,59.22H91.56c-.44-5.56,0-18.3,7.29-23,5.49-3.61,17.51-2,39.65,10.18,3,1.68,6,3.18,8.93,4.6,29,14.68,53.29,18.88,70.34,7.57C240,114.86,239,83.16,238.1,71.47"/>
          </g>
        </svg>
    `;

  return divIcon({
     html: svg,
     iconSize:     [40, 40], // size of the icon
     iconAnchor:   [20, 0], // point of the icon which will correspond to marker's location [iconWidth/2, iconHeight]
   });
}
