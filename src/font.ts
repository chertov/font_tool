import * as fs from 'fs'

import {Buf} from './buf'
import { bool } from 'prop-types';

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

function get_bit_pos(pos: number) {
    let byte_pos = Math.floor(pos / 8)
    let bit_pos = pos % 8
    console.log(pos, ' - ', byte_pos, ':', bit_pos)
}

function get_bit(buf: Uint8Array, pos: number): Boolean {
    let byte_pos = Math.floor(pos / 8)
    let bit_pos = pos % 8
    // console.log(pos, ' - ', byte_pos, ':', bit_pos)
    const byte = buf[byte_pos];
    return ((byte >> bit_pos) & 1) == 1
}

export function read_font(data: Uint8Array) : Font {
    let buf = new Buf()
    buf.data = data

    console.log('file size: ', buf.data.length)

    let header = new UcsFontHeader()
    header.read_from(buf)
    console.log('header: ', header)

    let font = new Font()
    font.magic = header.magic

    let blocks = []
    for(let block_index = 0; block_index < header.blocks; block_index++) {
        let block = new UcsFontBlock()
        block.read_from(buf)
        console.log('block: ', block)
        blocks.push(block)
        console.log('buf.offset: ', buf.offset)

        let fontBlock = new FontBlock()
        fontBlock.start = block.start
        fontBlock.end = block.end
        fontBlock.width = block.width
        fontBlock.height = block.height

        const bits_per_symbol = block.width * block.height
        console.log('symbols count: ', block.end - block.start)
        console.log('bits_per_symbol: ', bits_per_symbol)
        console.log('bytes_per_symbol: ', bits_per_symbol / 8)
        const symbols_per_block = (block.xoffs - block.roffs)*8 / bits_per_symbol
        console.log('symbols_per_block: ', symbols_per_block)

        // let m_nFontBytes = (block.width + 7)  / 8 * block.height;
        // console.log('m_nFontBytes', m_nFontBytes)
        // {
        //     const symbols_per_block = (block.xoffs - block.roffs) / m_nFontBytes
        //     console.log('symbols_per_block: ', symbols_per_block)
        // }
        // m_pUFB = new UCS_FONT_BLOCK[m_UFH.blocks];
        // m_FileFont.Read(m_pUFB, sizeof(UCS_FONT_BLOCK) * m_UFH.blocks);
        // m_sizeFont.w = m_pUFB[0].width;	//暂时只取第一个区点阵的宽度和高度    // Временно принимают только ширину и высоту первой области решетки
        // m_sizeFont.h = m_pUFB[0].height;
        // m_nFontBytes = (m_sizeFont.w + 7)  / 8 * m_sizeFont.h;
        // m_pASCIIFont = new uchar[m_nFontBytes * 128 + 128];
        // memset(m_pASCIIFont, 0, m_nFontBytes * 128 + 128);
        // printf("CLocales::Font w:%d h:%d,ucs blocks:%d,file size:%d\n",m_sizeFont.w,m_sizeFont.h,m_UFH.blocks,m_UFH.size);
        // //所有ASCII字体拷到缓冲
        // for(uint i = 0; i < m_UFH.blocks; i++) {
        //     //printf("CLocales::UCS_FONT_BLOCK[%d] codes:[%04x,%04x] w&h:[%dx%d] offset:[%d,%d]\n",
        //     //	i,m_pUFB[i].start,m_pUFB[i].end,m_pUFB[i].width,m_pUFB[i].height,m_pUFB[i].roffs,m_pUFB[i].xoffs);
        //     if(m_pUFB[i].end <= 0x80) {
        //         m_FileFont.Seek(m_pUFB[i].roffs, CFile::begin);
        //         m_FileFont.Read(&m_pASCIIFont[m_pUFB[i].start * m_nFontBytes], (m_pUFB[i].end - m_pUFB[i].start) * m_nFontBytes);
        //         m_FileFont.Seek(m_pUFB[i].xoffs, CFile::begin);
        //         m_FileFont.Read(&m_pASCIIFont[ 128 * m_nFontBytes + m_pUFB[i].start], m_pUFB[i].end - m_pUFB[i].start);
        //     }
        // }

        let pos = block.roffs;
        let symbols_data = buf.read_from_offset(pos, block.xoffs - block.roffs)
        for(let symbol_index = 0; symbol_index < symbols_per_block; symbol_index++) {
            // let start_pos = pos;
            // pos += bytes_per_symbol
            // // console.log('symbol ', symbol_index, '    start_pos: ', start_pos, '    end_pos: ', pos)
            let symbol = new FontSymbol();
            for(let h = 0; h < block.height; h++) {
                for(let w = 0; w < block.width; w++) {
                    //let char = get_bit(symbol_data, h*block.width + (block.width +1 - w))
                    let char = get_bit(symbols_data, symbol_index*bits_per_symbol + h*block.width + block.width - w)
                    symbol.bits.push(char)
                }
            }
            fontBlock.symbols.push(symbol)
        }
        font.blocks.push(fontBlock)
    }

    return font;
}



// read_font('./FontSmall.bin')


get_bit_pos(8*9+0)
get_bit_pos(8*9+1)
get_bit_pos(8*9+2)
get_bit_pos(8*9+3)
get_bit_pos(8*9+4)
get_bit_pos(8*9+5)
get_bit_pos(8*9+6)
get_bit_pos(8*9+7)
get_bit_pos(8*9+8)