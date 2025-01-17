/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
// eslint-disable-next-line deprecate/import
import { mount, ReactWrapper } from "enzyme";
import { ISendEventResponse, MatrixClient, MsgType, Room } from "matrix-js-sdk/src/matrix";
import { mocked } from "jest-mock";

import VoiceRecordComposerTile from "../../../../src/components/views/rooms/VoiceRecordComposerTile";
import { VoiceRecording } from "../../../../src/audio/VoiceRecording";
import { doMaybeLocalRoomAction } from "../../../../src/utils/local-room";
import { MatrixClientPeg } from "../../../../src/MatrixClientPeg";
import { IUpload } from "../../../../src/audio/VoiceMessageRecording";

jest.mock("../../../../src/utils/local-room", () => ({
    doMaybeLocalRoomAction: jest.fn(),
}));

describe("<VoiceRecordComposerTile/>", () => {
    let voiceRecordComposerTile: ReactWrapper<VoiceRecordComposerTile>;
    let mockRecorder: VoiceRecording;
    let mockUpload: IUpload;
    let mockClient: MatrixClient;
    const roomId = "!room:example.com";

    beforeEach(() => {
        mockClient = {
            sendMessage: jest.fn(),
        } as unknown as MatrixClient;
        MatrixClientPeg.get = () => mockClient;

        const props = {
            room: {
                roomId,
            } as unknown as Room,
        };
        mockUpload = {
            mxc: "mxc://example.com/voice",
        };
        mockRecorder = {
            stop: jest.fn(),
            upload: () => Promise.resolve(mockUpload),
            durationSeconds: 1337,
            contentType: "audio/ogg",
            getPlayback: () => ({
                thumbnailWaveform: [],
            }),
        } as unknown as VoiceRecording;
        voiceRecordComposerTile = mount(<VoiceRecordComposerTile {...props} />);
        voiceRecordComposerTile.setState({
            recorder: mockRecorder,
        });

        mocked(doMaybeLocalRoomAction).mockImplementation((
            roomId: string,
            fn: (actualRoomId: string) => Promise<ISendEventResponse>,
            _client?: MatrixClient,
        ) => {
            return fn(roomId);
        });
    });

    describe("send", () => {
        it("should send the voice recording", async () => {
            await (voiceRecordComposerTile.instance() as VoiceRecordComposerTile).send();
            expect(mockClient.sendMessage).toHaveBeenCalledWith(roomId, {
                "body": "Voice message",
                "file": undefined,
                "info": {
                    "duration": 1337000,
                    "mimetype": "audio/ogg",
                    "size": undefined,
                },
                "msgtype": MsgType.Audio,
                "org.matrix.msc1767.audio": {
                    "duration": 1337000,
                    "waveform": [],
                },
                "org.matrix.msc1767.file": {
                    "file": undefined,
                    "mimetype": "audio/ogg",
                    "name": "Voice message.ogg",
                    "size": undefined,
                    "url": "mxc://example.com/voice",
                },
                "org.matrix.msc1767.text": "Voice message",
                "org.matrix.msc3245.voice": {},
                "url": "mxc://example.com/voice",
            });
        });
    });
});
