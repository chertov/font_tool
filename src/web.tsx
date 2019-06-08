import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { FileInput } from "@blueprintjs/core";
import { Font, read_font } from './font'

interface IState {
    font?: Font;
    data?: Uint8Array;
}
interface IProps {}

export class FontTool extends React.Component<IProps, IState>{
    constructor(props: IProps) {
        super(props)

        this.state = {
            font: new Font(),
            data: new Uint8Array()
        };
    }
    public onLoadFile = (buf: ArrayBuffer) => {
        // console.log('load done', buf)
        let data = new Uint8Array(buf);
        let font = read_font(data);
        this.setState({data, font})
    }
    public onInputFileChange = (event) => {
        if (typeof FileReader !== 'function') throw ("The file API isn't supported on this browser.");
        let input = event.target;
        if (!input) throw ("The browser does not properly implement the event object");
        if (!event.target.files) throw ("This browser does not support the `files` property of the file input.");
        if (!input.files[0]) return undefined;
        let file = input.files[0];
        let fr = new FileReader();
        fr.onload = (event: any) => this.onLoadFile(event.target.result)
        fr.readAsArrayBuffer(file)
    }
    public render() {
        const { data, font } = this.state;

        let blocks = []
        for (let block_index = 0; block_index < font.blocks.length; block_index++) {
            let block = font.blocks[block_index]

            let symbols = []
            for (let symbol_index = 0; symbol_index < block.symbols.length; symbol_index++) {
                let symbol = block.symbols[symbol_index]

                let px_w = 4
                let px_h = 4
                let bits = []
                for (let h = 0; h < block.height; h++) {
                    for (let w = 0; w < block.width; w++) {
                        bits.push(
                            <rect key={"px_" + w + "x" + h}
                                x={w*px_w} y={h*px_h}
                                width={px_w} height={px_h}
                                style={{
                                    fill: symbol.bits[h*block.width + w] ? 'rgb(0,0,0)' : 'rgb(255,255,255)', 
                                }}
                            />
                        )
                    }
                }
                let sym = 
                    <div key={"sym_" + symbol_index} style={{'display': 'inline-block'}}>
                        {block.start + symbol_index}<br />
                        <svg width={block.width*px_w} height={block.height*px_h}>
                            {bits}
                            <rect width={block.width*px_w} height={block.height*px_h} style={{fillOpacity: 0, stroke: 'rgb(0,0,0)', strokeWidth: 1}}/>
                        </svg>
                    </div>

                symbols.push(sym)
            }

            let bloc = <div key={"block_" + block_index}>Block {block_index}<br/>{symbols}<br/></div>
            blocks.push(bloc)
        }

        return (
            <div>
                <FileInput disabled={false} text="Choose file..." onInputChange={this.onInputFileChange} />
                <br />
                {blocks}
            </div>
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const myContainerElement = document.getElementById("container");
    ReactDOM.render(<FontTool />, myContainerElement);
})