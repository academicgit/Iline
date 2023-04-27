import { compareObjects, deepClone } from "@/lib/client-utils";
import { defaultAudioSetting } from "@/lib/const";
import { useObservableState } from "@/lib/livekit-react-offical/hooks/internal";
import { curState$ } from "@/lib/observe/CurStateObs";
import { denoiseMethod$ } from "@/lib/observe/DenoiseMethodObs";
import { roominfo$ } from "@/lib/observe/RoomInfoObs";
import { DenoiseMethod, RoomMetadata } from "@/lib/types";
import { useMainBrowser } from "@/lib/useMainBrowser";
import { useCallback, useEffect, useMemo, useState } from "react";

export function OptionPanel() {
    const roominfo_after_enter = useObservableState(roominfo$, {
        room_name: "",
        participant_num: 0,
        max_participant_num: -1
    });
    const denoiseSetting = useObservableState(denoiseMethod$, {...defaultAudioSetting.denoiseMethod});
    // add cwy 查看当前状态是否为join
    const mcurState = useObservableState(curState$, {
        join: false,
        isAdmin: false
    });
    const [passwd, setPasswd] = useState("");
    const [capacity, setCapacity] = useState("");
    const [config, setConfig] = useState<DenoiseMethod>( {...defaultAudioSetting.denoiseMethod});
    const isMainBrowser  = useMainBrowser()
    const isnumber = (nubmer: string) => {
        const re = /^[1-9]\d*$/;//判断字符串是否为数字//判断正整数/[1−9]+[0−9]∗]∗/ 
        if (!re.test(nubmer)) {
            return false
        }
        return true
    }
    const isnumber2 = (nubmer: string) => {
        const re = /^[1-9]\d?$/;//判断字符串是否为数字//判断正整数/[1−9]+[0−9]∗]∗/ 
        if (!re.test(nubmer)) {
            return false
        }
        return true
    }
    const handleSubmit = (e: any) => {


        if (roominfo_after_enter.room_name == undefined && roominfo_after_enter.room_name == "") return
        updateRoomMeta(roominfo_after_enter.room_name).catch(e => {
            console.log(e)

        })
        if (capacity !== "" && !isnumber(capacity)) {
            alert("please type a number or leave it blank")
            e.preventDefault();
        }
        if (capacity !== "" && !isnumber2(capacity)) {
            alert("please type a number smaller than 100 or leave it blank")
            e.preventDefault();
        }

        //如果没有修改就不需要更新
        if(compareObjects(config,denoiseSetting)) return
        denoiseMethod$.next(deepClone(config))
    }

    const updateRoomMeta = useCallback(
        async (roomName: string) => {
            const url = '/api/roomMetadata'
            if (roomName === undefined) return undefined
            if (!url) return undefined
            const body = {
                metadata: {
                    passwd: passwd,
                    time: new Date().getTime(),
                    maxParticipants: Number(capacity)
                } as RoomMetadata,
                roomName: roomName
            };
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (response.status === 200) {
                return await response.json();
            }

            const { error } = await response.json();
            throw error;
        },
        [roominfo_after_enter.room_name, passwd, capacity]
    );


    return (
        <div className=" flex text-center justify-center items-center ">
            <label htmlFor="optionModel" className="btn  border-none btn-primary text-white">Setting</label>

            <input type="checkbox" id="optionModel" className="modal-toggle" />
            <div className="modal ">
                <div className="modal-box relative bg-primary form-control">
                    <label htmlFor="optionModel" className="btn btn-accent btn-sm btn-circle absolute right-2 top-2 ">✕</label>
                    {
                        mcurState.isAdmin &&
                        <div className="pl-4 pr-12">
  
                                <label className="label cursor-pointer justify-between">
                                    <span className="label-text text-white sm:text-lg">Set Password</span>
                                    <input
                                        className=" w-[10rem] input-sm sm:input-md rounded-lg border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition focus:border-white focus:outline-none focus:ring focus: ring-secondary-focus"
                                        id="passwd"
                                        name="passwd"
                                        type="text"
                                        placeholder="set room passwd"
                                        onChange={(inputEl) => setPasswd(inputEl.target.value)}
                                        autoComplete="off"
                                    />
                                </label>
      
                                <label className="label cursor-pointer justify-between">
                                    <span className="label-text text-white sm:text-lg">Room Capacity</span>
                                    <input
                                        className=" w-[10rem] input-sm sm:input-md rounded-lg border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition focus:border-white focus:outline-none focus:ring focus: ring-secondary-focus"
                                        id="capacity"
                                        name="capacity"
                                        type="text"
                                        placeholder="set room capacity"
                                        onChange={(inputEl) => {
                                            setCapacity(inputEl.target.value)
                                        }}
                                        autoComplete="off"
                                    />
                                </label>
                        
                        </div>
                    }

                    {
                        isMainBrowser && 
                        <div>
                        <div className=" divider mb-0"/>
                                <span className=" sm:text-xl font-bold">Choose Noise Reduction Method</span>
                                <div className=" my-2 w-full flex justify-around"   onChange={(v: any) => {
                                    if (config == null) return;
                                    const new_config = { ...config };
                                    new_config.speex = false
                                    new_config.rnn = false
                                    if(v.target.value == 'speex'){
                                        new_config.speex = true
                                    }else if(v.target.value == 'rnn'){
                                        new_config.rnn = true
                                    }
                                    setConfig(new_config);
                                    // console.log("update!~")
                                }}>
                                    <div className=" flex items-center gap-2 text-center">
                                        <input type="radio" value="none" name="denoiseMethod" id="denoiseMethod1" className="radio radio-success" checked={config ? config.speex == false &&  config.rnn == false : false}
                                        onChange={(v) => {}}
                                        ></input>
                                        <label htmlFor="denoiseMethod1" >None</label>
                                    </div>

                                    <div className=" flex items-center gap-2 text-center">
                                    <input type="radio" value="speex" name="denoiseMethod2" id="denoiseMethod2" className="radio radio-success" checked={config ? config.speex : false}
                                     onChange={(v) => {}}
                                    ></input>
                                    <label htmlFor="denoiseMethod2" >SPEEX</label>
                                    </div>

                                    <div className=" flex items-center gap-2 text-center">
                                    <input type="radio" value="rnn"  name="denoiseMethod3" id="denoiseMethod3" className="radio radio-success" checked={config ? config.rnn : false}
                                     onChange={(v) => {}}
                                    ></input>
                                    <label htmlFor="denoiseMethod3" >RNN</label>
                                    </div>
                                </div>
                        </div>
                    }
                        
                    <div className=" w-full flex justify-center">
                        <label htmlFor="optionModel" className="btn btn-md btn-secondary border-none mt-2" onClick={handleSubmit}>
                            Done
                        </label>
                    </div>
                </div>
            </div>

        </div>

    );
}