import {Buf} from './buf'

export class Font {
    magic: string
    blocks: FontBlock[]
    constructor() {
        this.magic = ''
        this.blocks = []
    }
}

class FontBlock {
    start: number       // ushort       Code start value
    end: number         // ushort       End code value
    width: number       // ushort       Lattice (grid) width
    height: number      // ushort       Lattice (grid) height
    symbols: FontSymbol[]
    constructor() {
        this.start = 0
        this.end = 0
        this.width = 0
        this.height = 0
        this.symbols = []
    }
}

class FontSymbol {
    bits: Boolean[]
    constructor() {
        this.bits = []
    }
}


class UcsFontHeader {
    magic: string    // char[16]
    size: number     // uint        Total font size
    blocks: number   // uint
    constructor() {
        this.magic = 'dahua ucs font'
        this.size = 0  
        this.blocks = 0
    }
    read_from(buf: Buf) {
        this.magic = buf.read_counted_str(16)
        this.size = buf.read_u32_le()
        this.blocks = buf.read_u32_le()
    }
}

class UcsFontBlock {
    start: number       // ushort       Code start value
    end: number         // ushort       End code value
    width: number       // ushort       Lattice (grid) width
    height: number      // ushort       Lattice (grid) height
    roffs: number       // uint         Font dot matrix data offset
    xoffs: number       // uint         Font extension data offset
    constructor() {
        this.start = 0
        this.end = 0
        this.width = 0
        this.height = 0
        this.roffs = 0
        this.xoffs = 0
    }
    read_from(buf: Buf) {
        this.start = buf.read_u16_le()
        this.end = buf.read_u16_le()
        this.width = buf.read_u16_le()
        this.height = buf.read_u16_le()
        this.roffs = buf.read_u32_le()
        this.xoffs = buf.read_u32_le()
    }
}

function get_bit(buf: Uint8Array, pos: number): Boolean {
    let byte_pos = Math.floor(pos / 8)
    let bit_pos = pos % 8
    const byte = buf[byte_pos];
    return ((byte >> bit_pos) & 1) == 1
}

export function read_font(data: Uint8Array, delta: number = 0) : Font {
    let buf = new Buf()
    buf.data = data
    let header = new UcsFontHeader()
    header.read_from(buf)
    let font = new Font()
    font.magic = header.magic
    let blocks = []
    for(let block_index = 0; block_index < header.blocks; block_index++) {
        let block = new UcsFontBlock()
        block.read_from(buf)
        blocks.push(block)

        let fontBlock = new FontBlock()
        fontBlock.start = block.start
        fontBlock.end = block.end
        fontBlock.width = block.width
        fontBlock.height = block.height

        const bytes_per_row = block.width / 8
        const bytes_per_symbol = bytes_per_row * block.height
        const bits_per_symbol = block.width * block.height
        const symbols_per_block = (block.xoffs - block.roffs)*8 / bits_per_symbol

        let pos = block.roffs;
        for(let symbol_index = 0; symbol_index < symbols_per_block; symbol_index++) {
            let symbol_data = buf.read_from_offset(pos, bytes_per_symbol)
            pos += bytes_per_symbol
            let symbol = new FontSymbol();
            for(let h = 0; h < block.height; h++) {
                for (let b_row = 0; b_row < bytes_per_row; b_row++) {
                    for(let i = 7; i >= 0; i--) {
                        let char = get_bit(symbol_data, h*block.width + 8*b_row + i)
                        symbol.bits.push(char)
                    }
                }
            }
            fontBlock.symbols.push(symbol)
        }
        font.blocks.push(fontBlock)
    }

    return font;
}
